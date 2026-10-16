const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in server/.env");
    process.exit(1);
  }
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  
  const total = await db.collection('products').countDocuments();
  const activeCount = await db.collection('products').countDocuments({ active: true });
  const zeroPrice = await db.collection('products').countDocuments({ $or: [{ price: { $lte: 0 } }, { price: { $exists: false } }] });
  const placeholderImages = await db.collection('products').countDocuments({
    $or: [
      { images: { $size: 0 } },
      { 'images.0.path': /placeholder/i }
    ]
  });
  const rxCount = await db.collection('products').countDocuments({ requiresPrescription: true });
  const outOfStockCount = await db.collection('products').countDocuments({ stockStatus: 'out_of_stock' });

  console.log(JSON.stringify({
    total,
    activeCount,
    zeroPrice,
    placeholderImages,
    rxCount,
    outOfStockCount
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
