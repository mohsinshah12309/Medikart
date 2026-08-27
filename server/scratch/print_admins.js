const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const AdminUser = require("../src/modules/admin-users/adminUser.model");
  const users = await AdminUser.find({}, { name: 1, email: 1, role: 1, active: 1 });
  console.log("Admin Users:");
  console.log(users);
  
  await mongoose.disconnect();
}

run().catch(console.error);
