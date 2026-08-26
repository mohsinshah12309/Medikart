/**
 * phase21SecurityHardening.test.js — Phase 21 security unit tests.
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

// Mock SMTP sendEmail so it doesn't try to connect to a real SMTP server
jest.mock("../../src/integrations/smtp", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mock-id" }),
}));

const smtpMock = require("../../src/integrations/smtp");

let superAdminUser;
let regularAdminUser;
let inactiveAdminUser;
let superAdminToken;
let regularAdminToken;
let inactiveAdminToken;
let jwtSecret;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await PasswordReset.deleteMany({});

  jwtSecret = process.env.JWT_SECRET || "test-secret";

  superAdminUser = await AdminUser.create({
    name: "Super Admin",
    email: "super@test.com",
    role: "super_admin",
    permissions: ["products", "orders", "narcotics_approval", "reports", "settings"],
    passwordHash: "$2a$12$dummyhashformanytests",
    active: true,
  });

  regularAdminUser = await AdminUser.create({
    name: "Regular Admin",
    email: "admin@test.com",
    role: "admin",
    permissions: ["products"],
    passwordHash: "$2a$12$dummyhashformanytests",
    active: true,
  });

  inactiveAdminUser = await AdminUser.create({
    name: "Inactive Admin",
    email: "inactive@test.com",
    role: "admin",
    permissions: ["products"],
    passwordHash: "$2a$12$dummyhashformanytests",
    active: false,
  });

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

  inactiveAdminToken = jwt.sign(
    { sub: inactiveAdminUser._id.toString(), role: "admin", email: inactiveAdminUser.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  smtpMock.sendEmail.mockClear();
});

afterAll(async () => {
  await AdminUser.deleteMany({});
  await ActivityLog.deleteMany({});
  await PasswordReset.deleteMany({});
  await mongoose.connection.close();
});

describe("Phase 21 — Security Hardening, Audit Integrity & Admin Management", () => {
  
  describe("AUTHORIZATION BOUNDARIES", () => {
    test("1. unauthenticated admin-management request → 401", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users");
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    test("2. regular admin cannot create admin", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({
          name: "Test New",
          email: "new@test.com",
          role: "admin",
        });
      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
    });

    test("3. regular admin cannot modify admin", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({
          name: "Attacker Update",
        });
      expect(res.status).toBe(403);
    });

    test("4. regular admin cannot delete admin", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`);
      expect(res.status).toBe(403);
    });

    test("5. regular admin cannot modify roles", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({
          role: "super_admin",
        });
      expect(res.status).toBe(403);
    });

    test("6. regular admin cannot modify permissions", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({
          permissions: ["products", "orders", "reports"],
        });
      expect(res.status).toBe(403);
    });
  });

  describe("PRIVILEGE ESCALATION & MASS ASSIGNMENT", () => {
    test("7. role injection is rejected", async () => {
      // Trying to inject a role not defined in enum or extra field in strict zod schema
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Admin Escalation",
          email: "escalate@test.com",
          role: "super_admin_injected_wrong",
          permissions: [],
        });
      // Should fail Zod validation
      expect(res.status).toBe(400);
    });

    test("8. permission injection is rejected (unexpected fields)", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Admin Escalation",
          email: "escalate@test.com",
          role: "admin",
          permissions: ["products"],
          extra_fake_field: "test",
        });
      // Should fail Zod strict validation
      expect(res.status).toBe(400);
    });

    test("9. passwordHash injection is rejected", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Admin Escalation",
          email: "escalate@test.com",
          role: "admin",
          passwordHash: "hacked-hash",
        });
      expect(res.status).toBe(400);
    });

    test("10. resetToken injection is rejected", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          resetToken: "hacked-reset-token",
        });
      expect(res.status).toBe(400);
    });

    test("11. unexpected security fields cannot be mass-assigned", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          twoFactorSecret: "hacked-secret",
        });
      expect(res.status).toBe(400);
    });
  });

  describe("IDOR / OBJECT-LEVEL AUTHORIZATION", () => {
    test("12. nonexistent target rejected", async () => {
      const nonexistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/v1/admin/users/${nonexistentId}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Name",
        });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test("13. malformed target rejected", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/malformed-id-123`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Name",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.details[0].message).toMatch(/Invalid admin user ID format/i);
    });

    test("14. non-admin target handled safely", async () => {
      // In Medikart, there's only AdminUser collection. So any non-existent ID results in 404.
      const nonexistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/v1/admin/users/${nonexistentId}`)
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
    });

    test("15. unauthorized target cannot be manipulated (tested via regular admin role check)", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${regularAdminToken}`)
        .send({
          name: "Hacked",
        });
      expect(res.status).toBe(403);
    });
  });

  describe("SUPER ADMIN SAFEGUARDS", () => {
    test("16. last active Super Admin cannot be deleted", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot delete the last remaining active Super Admin/i);
    });

    test("17. last active Super Admin cannot be deactivated", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          active: false,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot demote or deactivate the last remaining active Super Admin/i);
    });

    test("18. last active Super Admin cannot be demoted", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          role: "admin",
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot demote or deactivate the last remaining active Super Admin/i);
    });

    test("19. multiple Super Admin scenario works correctly", async () => {
      // Create a second active Super Admin
      const secondSuper = await AdminUser.create({
        name: "Second Super",
        email: "super2@test.com",
        role: "super_admin",
        passwordHash: "dummy",
        active: true,
      });

      // Deactivating the first Super Admin should now work since there are 2 active Super Admins
      const res = await request(app)
        .put(`/api/v1/admin/users/${superAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          active: false,
        });
      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);

      const activeSuperToken = jwt.sign(
        { sub: secondSuper._id.toString(), role: "super_admin", email: secondSuper.email },
        jwtSecret,
        { expiresIn: "1h" }
      );

      // Try deactivating the second Super Admin (now the only active one left) -> should fail
      const res2 = await request(app)
        .put(`/api/v1/admin/users/${secondSuper._id}`)
        .set("Authorization", `Bearer ${activeSuperToken}`)
        .send({
          active: false,
        });
      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/Cannot demote or deactivate the last remaining active Super Admin/i);
    });
  });

  describe("ACCOUNT STATE ENFORCEMENT", () => {
    test("20. inactive admin cannot perform protected admin operations", async () => {
      // Use the token of an inactive admin user
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${inactiveAdminToken}`);
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toMatch(/Authentication required/i);
    });
  });

  describe("RESPONSE SECURITY", () => {
    test("21. passwordHash never appears in responses", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach((user) => {
        expect(user.passwordHash).toBeUndefined();
      });
    });

    test("22. reset token never appears in responses", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Token Check Admin",
          email: "tokencheck@test.com",
          role: "admin",
          permissions: [],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.resetToken).toBeUndefined();
      expect(res.body.data.tokenHash).toBeUndefined();
    });

    test("23. sensitive authentication fields never appear", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Updated Name",
        });
      expect(res.status).toBe(200);
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.twoFactorSecret).toBeUndefined();
    });
  });

  describe("AUDIT LOG INTEGRITY", () => {
    test("24. successful admin mutation creates Activity Log", async () => {
      const payload = {
        name: "Audit Test Admin",
        email: "audit@test.com",
        role: "admin",
        permissions: ["products"],
      };
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send(payload);
      expect(res.status).toBe(201);

      const log = await ActivityLog.findOne({ action: "admin_user_created" });
      expect(log).toBeTruthy();
      expect(log.entityType).toBe("admin_user");
    });

    test("25. actor comes from authenticated identity", async () => {
      const payload = {
        name: "Audit Test Admin 2",
        email: "audit2@test.com",
        role: "admin",
        permissions: [],
      };
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send(payload);
      expect(res.status).toBe(201);

      const log = await ActivityLog.findOne({ action: "admin_user_created", entityId: res.body.data._id });
      expect(log).toBeTruthy();
      expect(log.actor.id).toBe(superAdminUser._id.toString());
      expect(log.actor.email).toBe(superAdminUser.email);
    });

    test("26. before state is correct on update", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Audit Name",
        });
      expect(res.status).toBe(200);

      const log = await ActivityLog.findOne({ action: "admin_user_updated", entityId: regularAdminUser._id });
      expect(log).toBeTruthy();
      expect(log.before.name).toBe("Regular Admin");
    });

    test("27. after state is correct on update", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Audit Name",
        });
      expect(res.status).toBe(200);

      const log = await ActivityLog.findOne({ action: "admin_user_updated", entityId: regularAdminUser._id });
      expect(log).toBeTruthy();
      expect(log.after.name).toBe("New Audit Name");
    });

    test("28. Activity Log contains required entity information", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);

      const log = await ActivityLog.findOne({ action: "admin_user_deleted", entityId: regularAdminUser._id });
      expect(log).toBeTruthy();
      expect(log.entityType).toBe("admin_user");
      expect(log.entityId.toString()).toBe(regularAdminUser._id.toString());
    });

    test("29. sensitive values are excluded from Activity Logs", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Name For Exclude",
        });
      expect(res.status).toBe(200);

      const log = await ActivityLog.findOne({ action: "admin_user_updated", entityId: regularAdminUser._id });
      expect(log).toBeTruthy();
      expect(log.before.passwordHash).toBeUndefined();
      expect(log.after.passwordHash).toBeUndefined();
      expect(log.before.twoFactorSecret).toBeUndefined();
      expect(log.after.twoFactorSecret).toBeUndefined();
    });

    test("30. client cannot forge Activity Log actor (strict schema blocks unexpected parameters)", async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${regularAdminUser._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "New Name Fake Actor",
          actor: { id: "fake-id", email: "fake@fake.com" },
        });
      // strict zod schema rejects 'actor'
      expect(res.status).toBe(400);
    });
  });

  describe("ERROR SECURITY", () => {
    test("31. unauthorized errors do not expose sensitive internals", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", "Bearer invalid-token-format");
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Authentication required");
      expect(res.body.stack).toBeUndefined();
    });

    test("32. malformed requests do not expose stack traces/secrets", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          // Missing required name, email
          role: "admin",
        });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.stack).toBeUndefined();
    });
  });

});
