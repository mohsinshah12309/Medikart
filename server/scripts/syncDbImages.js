const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('../src/modules/categories/category.model');
const Condition = require('../src/modules/conditions/condition.model');

async function syncImages() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to DB');

  const categories = await Category.find();
  for (const cat of categories) {
    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    cat.imageUrl = `/images/categories/${slug}.svg`;
    await cat.save();
    console.log(`Updated Category [${cat.name}] -> ${cat.imageUrl}`);
  }

  const conditions = await Condition.find();
  for (const cond of conditions) {
    const slug = cond.slug || cond.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    cond.imageUrl = `/images/conditions/${slug}.svg`;
    await cond.save();
    console.log(`Updated Condition [${cond.name}] -> ${cond.imageUrl}`);
  }

  console.log('All DB category & condition images synchronized successfully!');
  await mongoose.disconnect();
}

syncImages();
