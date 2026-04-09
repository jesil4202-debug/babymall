const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, getFeaturedProducts, createProduct,
  updateProduct, deleteProduct, deleteProductImage, addReview, getLowStockProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/low-stock', protect, authorize('admin'), getLowStockProducts);
router.get('/:slug', getProduct);

router.post('/', protect, authorize('admin'), upload.array('images', 6), createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 6), updateProduct);
router.delete('/:id/images/:publicId', protect, authorize('admin'), deleteProductImage);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

router.post('/:id/reviews', protect, addReview);

module.exports = router;
