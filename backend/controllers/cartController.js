const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { calculateTotals } = require('../utils/calculateTotals');

const formatCartResponse = async (cartDoc) => {
  if (!cartDoc) {
    return { items: [], subtotal: 0, deliveryTotal: 0, totalAmount: 0 };
  }
  await cartDoc.populate('items.product', 'name images stock slug isActive');
  
  // Calculate totals
  const totals = calculateTotals(cartDoc.items);
  
  return {
    _id: cartDoc._id,
    user: cartDoc.user,
    items: cartDoc.items,
    ...totals
  };
};

// @desc    Get cart
// @route   GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const cartResponse = await formatCartResponse(cart);
    res.status(200).json({ success: true, cart: cartResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const price = variant?.price || product.price;
    const deliveryCharge = product.deliveryCharge || 0;

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.label === variant?.label
    );

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
      // Refresh snapshot values on add/update to keep cart totals accurate.
      existingItem.price = price;
      existingItem.deliveryCharge = deliveryCharge;
    } else {
      cart.items.push({ 
        product: productId, 
        quantity, 
        variant,
        price,
        deliveryCharge
      });
    }

    await cart.save();
    const cartResponse = await formatCartResponse(cart);

    res.status(200).json({ success: true, cart: cartResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    } else {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: 'Insufficient stock.' });
      }

      item.quantity = quantity;
      item.price = item.variant?.price || product.price;
      item.deliveryCharge = product.deliveryCharge || 0;
    }

    await cart.save();
    const cartResponse = await formatCartResponse(cart);

    res.status(200).json({ success: true, cart: cartResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    await cart.save();
    
    const cartResponse = await formatCartResponse(cart);
    res.status(200).json({ success: true, cart: cartResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { new: true });
    const cartResponse = await formatCartResponse(cart);
    res.status(200).json({ success: true, message: 'Cart cleared.', cart: cartResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
