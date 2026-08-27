const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const AdminUser = require("../src/modules/admin-users/adminUser.model");
  
  const newPasswordHash = await bcrypt.hash("medikart@admin123", 12);
  
  // Find or create admin@medikart.pk
  const admin = await AdminUser.findOneAndUpdate(
    { email: "admin@medikart.pk" },
    {
      $set: {
        name: "Super Admin",
        passwordHash: newPasswordHash,
        role: "super_admin",
        active: true
      }
    },
    { upsert: true, new: true }
  );
  
  console.log("Updated Admin User:");
  console.log(admin);
  
  await mongoose.disconnect();
}

run().catch(console.error);
