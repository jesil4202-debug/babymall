const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    // Support both flat imageUrl (for easy access) and nested image object (for Cloudinary)
    imageUrl: { type: String },
    image: { url: String, publicId: String },
    link: { type: String },
    buttonText: { type: String, default: 'Shop Now' },
    order: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ['hero', 'category', 'promo'], default: 'hero' },
  },
  { timestamps: true }
);

// Virtual to always provide imageUrl from either source
bannerSchema.virtual('effectiveImageUrl').get(function () {
  return this.imageUrl || this.image?.url || '';
});

module.exports = mongoose.model('Banner', bannerSchema);
