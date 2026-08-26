/**
 * adminUserManagement.test.js — Phase 20 unit tests.
 */

jest.setTimeout(60000);

require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const ActivityLog = require("../../src/modules/activity-logs/activityLog.model");
const PasswordReset = require("../../src/modules/admin-users/passwordReset.model");
const { resetRateLimiters } = require("../../src/middleware/rateLimiter");

// Mock the SMTP sendEmail integration so emails are not sent over the network
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mock-id" }),
}));

const smtpMock = require("../../src/integrations/smtp");

let superAdminUser;
let regularAdminUser;
let superAdminToken;
let regularAdminToken;
let jwtSecret;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  resetRateLimiters();
  // Clear the database tables to ensure clean slate
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await PasswordReset.deleteMany({});

  jwtSecret = process.env.JWT_SECRET || "test-secret";

  // Create initial Super Admin and Regular Admin
  superAdminUser = await AdminUser.create({
    name: "Super Admin",
    email: "super@test.com",
    role: "super_admin",
    permissions: ["products", "orders", "narcotics_approval", "reports", "settings"],
    passwordHash: "dummy-hash",
    active: true,
  });

  regularAdminUser = await AdminUser.create({
    name: "Regular Admin",
    email: "admin@test.com",
    role: "admin",
    permissions: ["products"],
    passwordHash: "dummy-hash",
    active: true,
  });

  // Generate tokens
  superAdminToken = jwt.sign(
    { sub: superAdminUser._id.toString(), role: "super_admin", email: superAdminUser.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  regularAdminToken = jwt.sign(
    { sub: regularAdminUser._id.toString(), role: "admin", email: regularAdminUser.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  // Clear mock history
  smtpMock.sendEmail.mockClear();
});

afterAll(async () => {
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await PasswordReset.deleteMany({});
  await mongoose.connection.close();
});

describe("Admin User Management (Phase 20 — Super Admin Only)", () => {
  
  describe("POST /api/v1/admin/users (Create Admin Account)", () => {
    test("1. Super Admin can create a new admin account, and it triggers a reset link email", async () => {
      const payload = {
        name: "New Admin",
        email: "newadmin@test.com",
        role: "admin",
        permissions: ["products", "orders"],
      };

      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.email).toBe(payload.email);
      expect(res.body.data.role).toBe(payload.role);
      expect(res.body.data.permissions).toEqual(payload.permissions);
      expect(res.body.data.passwordHash).toBeUndefined();

      // Check that a database record exists
      const dbUser = await AdminUser.findOne({ email: "newadmin@test.com" });
      expect(dbUser).toBeTruthy();
      expect(dbUser.active).toBe(true);

      // Verify that SMTP was called with a reset-link email pattern, and no plaintext/hashed password is leaked
      expect(smtpMock.sendEmail).toHaveBeenCalledTimes(1);
      const emailArgs = smtpMock.sendEmail.mock.calls[0][0];
      expect(emailArgs.to).toBe("newadmin@test.com");
      expect(emailArgs.html).toContain("reset-password");
      expect(emailArgs.html).not.toContain("dummy-hash");
      
      // Verify that an Activity Log was written with the correct action and actor
      const log = await ActivityLog.findOne({ action: "admin_user_created" });
      expect(log).toBeTruthy();
      expect(log.actor.id).toBe(superAdminUser._id.toString());
      expect(log.entityType).toBe("admin_user");
      expect(log.entityId.toString()).toBe(dbUser._id.toString());
      expect(log.before).toBeNull();
      expect(log.after.email).toBe("newadmin@test.com");
    });

    test("2. Regular Admin is rejected with 403 when attempting to create an admin account", async () => {
      const payload = {
        name: "Forbidden Admin",
        email: "forbidden@test.com",
        role: "admin",
        permissions: ["products"],
      };

      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/Super Admin privileges/i);

      // Verify no database record was created
      const dbUser = await AdminUser.findOne({ email: "forbidden@test.com" });
      expect(dbUser).toBeNull();
    });
  });

  describe("GET /api/v1/admin/users (List Admin Accounts)", () => {
    test("3. Super Admin can retrieve the list of admins, and it never contains password hashes", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Ensure passwordHash is omitted for all users
      res.body.data.forEach((user) => {
        expect(user.passwordHash).toBeUndefined();
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.role).toBeDefined();
      });
    });

    test("4. Regular Admin is rejected with 403 when trying to list admin accounts", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
    });
  });

  describe("PUT /api/v1/admin/users/:id (Update Admin Account)", () => {
    test("5. Super Admin can update another admin user's details, role, and permissions, producing an Activity Log", async () => {
      const payload = {
        name: "Regular Admin Updated",
        role: "super_admin",
        permissions: ["products", "settings"],
      };

      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.role).toBe(payload.role);
      expect(res.body.data.permissions).toEqual(payload.permissions);

      // Verify DB update
      const dbUser = await AdminUser.findById(regularAdminUser._id);
      expect(dbUser.name).toBe(payload.name);
      expect(dbUser.role).toBe(payload.role);
      expect(dbUser.permissions).toEqual(payload.permissions);

      // Check Activity Log
      const log = await ActivityLog.findOne({ action: "admin_user_updated" });
      expect(log).toBeTruthy();
      expect(log.actor.id).toBe(superAdminUser._id.toString());
      expect(log.entityId.toString()).toBe(regularAdminUser._id.toString());
      expect(log.before.name).toBe("Regular Admin");
      expect(log.after.name).toBe(payload.name);
    });

    test("6. Regular Admin is rejected with 403 when editing any account (including their own)", async () => {
      // Editing another account
      const res1 = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({ role: "super_admin" });

      expect(res1.status).toBe(403);

      // Editing their own account
      const res2 = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({ permissions: ["products", "orders"] });

      expect(res2.status).toBe(403);
    });

    test("7. Safeguard: Super Admin cannot deactivate or demote the last remaining active Super Admin", async () => {
      // Attempt to deactivate self (the only active Super Admin)
      const res1 = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ active: false });

      expect(res1.status).toBe(400);
      expect(res1.body.message).toMatch(/Cannot demote or deactivate the last remaining active Super Admin/i);

      // Attempt to demote self to regular admin
      const res2 = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ role: "admin" });

      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/Cannot demote or deactivate the last remaining active Super Admin/i);

      // Confirm self remains active and role remains super_admin in DB
      const dbUser = await AdminUser.findById(superAdminUser._id);
      expect(dbUser.active).toBe(true);
      expect(dbUser.role).toBe("super_admin");
    });
  });

  describe("DELETE /api/v1/admin/users/:id (Delete Admin Account)", () => {
    test("8. Super Admin can delete another admin user, producing an Activity Log", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      // Verify DB removal
      const dbUser = await AdminUser.findById(regularAdminUser._id);
      expect(dbUser).toBeNull();

      // Check Activity Log
      const log = await ActivityLog.findOne({ action: "admin_user_deleted" });
      expect(log).toBeTruthy();
      expect(log.actor.id).toBe(superAdminUser._id.toString());
      expect(log.entityId.toString()).toBe(regularAdminUser._id.toString());
      expect(log.before.email).toBe(regularAdminUser.email);
      expect(log.after).toBeNull();
    });

    test("9. Regular Admin is rejected with 403 when trying to delete an admin account", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`);

      expect(res.status).toBe(403);

      // Verify DB record still exists
      const dbUser = await AdminUser.findById(regularAdminUser._id);
      expect(dbUser).toBeTruthy();
    });

    test("10. Safeguard: Super Admin cannot delete the last remaining active Super Admin", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot delete the last remaining active Super Admin/i);

      // Verify DB record still exists and is active
      const dbUser = await AdminUser.findById(superAdminUser._id);
      expect(dbUser).toBeTruthy();
      expect(dbUser.active).toBe(true);
    });
  });
});
