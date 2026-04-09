const express = require('express');
const router = express.Router();
const { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');
const { uploadBanner } = require('../middleware/upload');

router.get('/', getBanners);
router.get('/all', protect, authorize('admin'), getAllBanners);
router.post('/', protect, authorize('admin'), uploadBanner.single('image'), createBanner);
router.put('/:id', protect, authorize('admin'), uploadBanner.single('image'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

module.exports = router;
