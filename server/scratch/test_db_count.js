const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const Product = require("../src/modules/products/product.model");
  const count = await Product.countDocuments({});
  console.log("Total Products in DB:", count);
  
  // Print 1 product to check
  const oneProduct = await Product.findOne({});
  console.log("One product from DB:", oneProduct);
  
  await mongoose.disconnect();
}

run().catch(console.error);
