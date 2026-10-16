const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const lowPrice = await db.collection('products').find({ price: { $lt: 10 } }, { projection: { name: 1, price: 1, slug: 1 } }).toArray();
  const highPrice = await db.collection('products').find({ price: { $gt: 100000 } }, { projection: { name: 1, price: 1, slug: 1 } }).toArray();

  console.log("Low price (< Rs 10):", lowPrice.length, lowPrice.slice(0, 5));
  console.log("High price (> Rs 100,000):", highPrice.length, highPrice.slice(0, 5));

  await mongoose.disconnect();
}

main().catch(console.error);
