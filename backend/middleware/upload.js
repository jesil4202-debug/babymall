const multer = require('multer');

// Use memory storage to get file buffer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for standard uploads
});

const uploadBanner = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for banners
});

module.exports = { upload, uploadBanner };
