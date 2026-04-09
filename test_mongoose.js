const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});
const Product = require('./backend/models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
  try {
    const p = new Product({
      name: "TestProduct",
      price: 100,
      description: "Test Desc",
      category: "Toys",
      stock: 10
    });
    await p.save();
    console.log("Saved successfully!");
  } catch (err) {
    console.log("ERROR STACK:");
    console.log(err.stack);
  }
  process.exit(0);
}
run();
