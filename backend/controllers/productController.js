const Product = require('../models/Product');
const supabase = require('../utils/supabase');
const sharp = require('sharp');
const mongoose = require('mongoose');

const toSafeDeliveryCharge = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const toPublicImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  const sanitized = value.replace(/^\/+/, '');
  const filePath = sanitized.startsWith('products/') ? sanitized : `products/${sanitized}`;
  const { data } = supabase.storage.from('products').getPublicUrl(filePath);
  return data?.publicUrl || '';
};

const withDeliveryChargeFallback = (productDoc) => {
  if (!productDoc) return productDoc;
  const product = productDoc.toObject ? productDoc.toObject() : { ...productDoc };
  product.deliveryCharge = toSafeDeliveryCharge(
    product.deliveryCharge ?? product.shippingCharge ?? 0
  );
  const normalizedImages = Array.isArray(product.images)
    ? product.images
        .map((img) => {
          const rawValue = typeof img === 'string' ? img : img?.url || img?.publicId || '';
          const url = toPublicImageUrl(rawValue);
          if (!url) return null;
          return {
            url,
            publicId: typeof img === 'object' ? img?.publicId : undefined,
          };
        })
        .filter(Boolean)
    : [];

  // Backward compatibility for older records storing a single image string/url field.
  if (normalizedImages.length === 0 && typeof product.image === 'string') {
    const legacyUrl = toPublicImageUrl(product.image);
    if (legacyUrl) normalizedImages.push({ url: legacyUrl });
  }

  product.images = normalizedImages;
  product.image = normalizedImages[0]?.url || '';
  return product;
};

const setPublicCacheHeaders = (res) => {
  res.set('Cache-Control', 'public, max-age=60');
};

const parseNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

// @desc    Get all products with filters/pagination
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    setPublicCacheHeaders(res);
    const {
      page = 1,
      limit = 12,
      category,
      ageGroup,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      featured,
      brand,
    } = req.query;

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(24, Math.max(1, Number.parseInt(limit, 10) || 12));
    const skip = (safePage - 1) * safeLimit;
    const query = { isActive: true };

    if (category) query.category = category;
    if (ageGroup) query.ageGroup = ageGroup;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (featured) query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .select('name slug price originalPrice discount category ageGroup brand images stock rating numReviews isFeatured deliveryCharge createdAt');

    res.status(200).json({
      success: true,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      products: products.map(withDeliveryChargeFallback),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Get single product by slug
// @route   GET /api/products/:slug
exports.getProduct = async (req, res) => {
  try {
    setPublicCacheHeaders(res);
    const identifier = req.params.slug;
    const query = mongoose.Types.ObjectId.isValid(identifier)
      ? { _id: identifier }
      : { slug: identifier, isActive: true };

    const productDoc = await Product.findOne(query).populate('reviews.user', 'name avatar');
    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = withDeliveryChargeFallback(productDoc);
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to load product' });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  try {
    setPublicCacheHeaders(res);
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(10)
      .select('name slug price originalPrice discount category ageGroup brand images stock rating numReviews isFeatured deliveryCharge createdAt');
    res.status(200).json({ success: true, products: products.map(withDeliveryChargeFallback) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Create product (admin)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const price = parseNonNegativeNumber(req.body?.price);
    const stock = parseNonNegativeNumber(req.body?.stock);
    const deliveryCharge =
      req.body?.deliveryCharge === undefined || req.body?.deliveryCharge === ''
        ? 0
        : parseNonNegativeNumber(req.body?.deliveryCharge);

    if (!name || price === null || stock === null || deliveryCharge === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product input. Name, price, stock, and delivery charge are required and must be non-negative.',
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product image is required.' });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '').replace(/\.[^/.]+$/, '');
        const filePath = `products/${Date.now()}-${safeName}.webp`;
        
        const optimizedBuffer = await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const { error } = await supabase.storage
          .from('products')
          .upload(filePath, optimizedBuffer, { contentType: 'image/webp' });
        if (error) throw new Error('Image upload failed: ' + error.message);
        
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        images.push({ url: publicUrl, publicId: filePath });
      }
    }

    const productPayload = {
      ...req.body,
      name,
      price,
      stock,
      deliveryCharge,
      images,
    };
    const product = await Product.create(productPayload);
    res.status(201).json({ success: true, product: withDeliveryChargeFallback(product) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Update product (admin)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (req.body?.price !== undefined) {
      const parsedPrice = parseNonNegativeNumber(req.body.price);
      if (parsedPrice === null) {
        return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
      }
      req.body.price = parsedPrice;
    }
    if (req.body?.stock !== undefined) {
      const parsedStock = parseNonNegativeNumber(req.body.stock);
      if (parsedStock === null) {
        return res.status(400).json({ success: false, message: 'Stock must be a non-negative number.' });
      }
      req.body.stock = parsedStock;
    }
    if (req.body?.deliveryCharge !== undefined) {
      const parsedDelivery = parseNonNegativeNumber(req.body.deliveryCharge);
      if (parsedDelivery === null) {
        return res.status(400).json({ success: false, message: 'Delivery charge must be a non-negative number.' });
      }
      req.body.deliveryCharge = parsedDelivery;
    }

    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '').replace(/\.[^/.]+$/, '');
        const filePath = `products/${Date.now()}-${safeName}.webp`;

        const optimizedBuffer = await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const { error } = await supabase.storage
          .from('products')
          .upload(filePath, optimizedBuffer, { contentType: 'image/webp' });
        if (error) throw new Error('Image upload failed: ' + error.message);
        
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        newImages.push({ url: publicUrl, publicId: filePath });
      }
      req.body.images = [...(product.images || []), ...newImages];
    }

    // Manually set modified flag to regenerate slug if name changed
    product.set(req.body);
    await product.save();

    res.status(200).json({ success: true, product: withDeliveryChargeFallback(product) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Delete product image (admin)
// @route   DELETE /api/products/:id/images/:publicId
exports.deleteProductImage = async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await supabase.storage.from('products').remove([publicId]);
    await Product.findByIdAndUpdate(req.params.id, {
      $pull: { images: { publicId: publicId } },
    });
    res.status(200).json({ success: true, message: 'Image deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Delete images from supabase
    const imagePaths = product.images.map(img => img.publicId).filter(Boolean);
    if (imagePaths.length > 0) {
      await supabase.storage.from('products').remove(imagePaths);
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Add review
// @route   POST /api/products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product.' });
    }

    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating: Number(req.body.rating),
      comment: req.body.comment,
    });

    product.updateRating();
    await product.save();

    res.status(201).json({ success: true, message: 'Review added.', product: withDeliveryChargeFallback(product) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Get low stock products (admin)
// @route   GET /api/products/low-stock
exports.getLowStockProducts = async (req, res) => {
  try {
    setPublicCacheHeaders(res);
    const products = await Product.find({ stock: { $lte: 10 }, isActive: true }).select(
      'name stock category images'
    );
    res.status(200).json({ success: true, products: products.map(withDeliveryChargeFallback) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
