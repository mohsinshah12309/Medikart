const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

async function checkDbSettings() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const settings = await db.collection('settings').find({}).toArray();
  console.log("Settings docs count:", settings.length);
  settings.forEach(s => {
    console.log("Setting doc:", JSON.stringify(s, null, 2));
  });

  const content = await db.collection('contents').find({}).toArray();
  console.log("Contents docs count:", content.length);
  content.forEach(c => {
    console.log("Content doc:", JSON.stringify(c, null, 2));
  });

  await mongoose.disconnect();
}

checkDbSettings().catch(console.error);
