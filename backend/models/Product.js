const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },   // e.g. "Size", "Color"
  options: [
    {
      label: { type: String, required: true }, // e.g. "Small", "Blue"
      stock: { type: Number, default: 0 },
      price: { type: Number },                 // override base price if needed
    },
  ],
});

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name required'], trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 },
    category: {
      type: String,
      required: true,
      enum: ['clothing', 'feeding', 'toys', 'nursery', 'bath', 'health', 'travel', 'accessories'],
    },
    ageGroup: {
      type: String,
      enum: ['0-3m', '3-6m', '6-12m', '1-2y', '2-3y', '3-5y', '5+y', 'all'],
      default: 'all',
    },
    brand: { type: String },
    images: [{ url: String, publicId: String }],
    variants: [variantSchema],
    stock: { type: Number, required: true, default: 0 },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tags: [String],
    weight: { type: Number },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    deliveryCharge: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug
productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  // Calculate discount
  if (this.originalPrice && this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
});

// Update rating stats
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.rating = Math.round((total / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

module.exports = mongoose.model('Product', productSchema);
