/**
 * seedSuperAdmin.js — Phase 5 seed script.
 *
 * Creates the initial Super Admin account directly in the database.
 * This is NOT an API endpoint — it is run once from the CLI:
 *
 *   node server/scripts/seedSuperAdmin.js
 *
 * Usage:
 *   node server/scripts/seedSuperAdmin.js --email admin@example.com --password "YourStr0ngP@ss"
 *
 * If the email already exists, the script exits cleanly without overwriting.
 *
 * Security rules enforced here:
 *   - Password is hashed with bcrypt (cost 12) before being stored.
 *   - The plaintext password is never logged, not even on success.
 *   - The script exits with code 1 on any error so CI/CD pipelines can detect failure.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Parse CLI args: --email <email> --password <pass>
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const email = getArg("email");
const password = getArg("password");

if (!email || !password) {
  console.error(
    "Usage: node server/scripts/seedSuperAdmin.js --email <email> --password <password>"
  );
  process.exit(1);
}

// Basic email sanity check
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error("Invalid email format.");
  process.exit(1);
}

// Minimum password strength
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[DB] Connected.");

    // Require model AFTER mongoose is connected
    const AdminUser = require("../src/modules/admin-users/adminUser.model");

    const existing = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.log(`[SEED] Super Admin with email "${email}" already exists. Nothing changed.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const superAdmin = await AdminUser.create({
      name: "Super Admin",
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "super_admin",
      permissions: [],
      active: true,
    });

    // Log the ID and email — never the password or hash
    console.log("[SEED] ✅ Super Admin created successfully.");
    console.log(`       ID   : ${superAdmin._id}`);
    console.log(`       Email: ${superAdmin.email}`);
    console.log(`       Role : ${superAdmin.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[SEED] ❌ Failed to seed Super Admin:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seed();
