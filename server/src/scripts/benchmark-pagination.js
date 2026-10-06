const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medikart_dev';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    const Product = require('../modules/products/product.model');
    const Order = require('../modules/orders/order.model');
    
    const count = await Product.countDocuments();
    console.log('Total Products in DB:', count);
    
    // Page 1 explain
    const exp1 = await Product.find({ active: true }).sort({ name: 1 }).skip(0).limit(24).explain('executionStats');
    console.log('Page 1 (skip 0):');
    console.log('  executionTimeMillis:', exp1.executionStats?.executionTimeMillis);
    console.log('  totalDocsExamined:', exp1.executionStats?.totalDocsExamined);
    console.log('  totalKeysExamined:', exp1.executionStats?.totalKeysExamined);
    console.log('  stage:', exp1.executionStats?.executionStages?.stage);
    
    // Deep page explain (skip 1000)
    const expDeep = await Product.find({ active: true }).sort({ name: 1 }).skip(1000).limit(24).explain('executionStats');
    console.log('\nPage 42 (skip 1000, offset-based):');
    console.log('  executionTimeMillis:', expDeep.executionStats?.executionTimeMillis);
    console.log('  totalDocsExamined:', expDeep.executionStats?.totalDocsExamined);
    console.log('  totalKeysExamined:', expDeep.executionStats?.totalKeysExamined);
    
    // Cursor-based explain
    const sample = await Product.findOne({ active: true }).sort({ name: 1 }).skip(1000);
    if (sample) {
      const expCursor = await Product.find({ active: true, name: { $gt: sample.name } }).sort({ name: 1 }).limit(24).explain('executionStats');
      console.log('\nCursor-based (seeking past 1000th product by name):');
      console.log('  executionTimeMillis:', expCursor.executionStats?.executionTimeMillis);
      console.log('  totalDocsExamined:', expCursor.executionStats?.totalDocsExamined);
      console.log('  totalKeysExamined:', expCursor.executionStats?.totalKeysExamined);
    }

    // Order compound index explain
    const expOrder = await Order.find().sort({ createdAt: -1 }).skip(0).limit(20).explain('executionStats');
    console.log('\nOrder query (sort createdAt: -1):');
    console.log('  executionTimeMillis:', expOrder.executionStats?.executionTimeMillis);
    console.log('  stage:', expOrder.executionStats?.executionStages?.stage);
    console.log('  totalDocsExamined:', expOrder.executionStats?.totalDocsExamined);
    console.log('  totalKeysExamined:', expOrder.executionStats?.totalKeysExamined);

    await mongoose.disconnect();
    console.log('\nBenchmark completed successfully.');
  } catch (err) {
    console.error('Benchmark error:', err);
    process.exit(1);
  }
})();
