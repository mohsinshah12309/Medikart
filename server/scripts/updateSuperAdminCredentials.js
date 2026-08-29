require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function updateSuperAdmin() {
  try {
    console.log("[DB] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[DB] Connected successfully.");

    const AdminUser = require("../src/modules/admin-users/adminUser.model");

    const targetEmail = "alishahmohsin938@gmail.com";
    const targetPassword = "medikart@03314170744Abdullah";
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
