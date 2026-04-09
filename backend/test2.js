const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
  try {
    const p = new Product({
      name: "TestProduct" + Date.now(),
      price: 100,
      description: "Test Desc",
      category: "Toys",
      stock: 10
    });
    await p.save();
    console.log("Saved successfully!");
  } catch (err) {
    console.log("ERROR STACK:", err.stack);
  }
  process.exit(0);
}
run();
