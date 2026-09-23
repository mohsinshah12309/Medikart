require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function updateSuperAdmin() {
  try {
    console.log("[DB] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[DB] Connected successfully.");

    const args = process.argv.slice(2);
    const getArg = (name) => {
      const idx = args.indexOf(`--${name}`);
      return idx !== -1 ? args[idx + 1] : null;
    };

    const targetEmail = getArg("email") || process.env.SUPER_ADMIN_EMAIL || process.env.SEED_SUPER_ADMIN_EMAIL;
    const targetPassword = getArg("password") || process.env.SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASS || process.env.SEED_SUPER_ADMIN_PASSWORD;

    if (!targetEmail || !targetPassword) {
      console.error("Error: Please provide --email and --password CLI arguments, or set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env.");
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(targetPassword, 12);

    const admin = await AdminUser.findOneAndUpdate(
      { email: targetEmail },
      {
        $set: {
          name: "Super Admin",
          passwordHash: passwordHash,
          role: "super_admin",
          active: true,
          permissions: [],
        },
      },
      { upsert: true, new: true }
    );

    console.log("✅ Super Admin credentials updated successfully:");
    console.log("   ID   :", admin._id);
    console.log("   Email:", admin.email);
    console.log("   Role :", admin.role);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to update Super Admin credentials:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

updateSuperAdmin();
