const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true, default: 0 },
  variant: {
    name: String,
    label: String,
    price: Number,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    coupon: { type: String },
    discount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update lastActivity on every save
cartSchema.pre('save', function () {
  this.lastActivity = new Date();
});

module.exports = mongoose.model('Cart', cartSchema);
