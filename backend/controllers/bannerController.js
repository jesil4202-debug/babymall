const Banner = require('../models/Banner');
const supabase = require('../utils/supabase');
const sharp = require('sharp');

// Helper to build image object
const buildImageObj = async (req) => {
  if (req.file) {
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '').replace(/\.[^/.]+$/, '');
    const fileName = `products/banners/${Date.now()}-${safeName}.webp`;

    const optimizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, optimizedBuffer, { contentType: 'image/webp' });
    if (error) throw new Error('Banner image upload failed: ' + error.message);
    
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    return { url: publicUrl, publicId: fileName };
  }
  if (req.body.imageUrl) return { url: req.body.imageUrl };
  return null;
};

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort('order position');
    res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('order position');
    res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const imgObj = await buildImageObj(req);
    const { title, subtitle, link, isActive, order } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      link,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      // Support both flat imageUrl and nested image object
      ...(imgObj ? { imageUrl: imgObj.url, image: imgObj } : {}),
    });
    res.status(201).json({ success: true, banner });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });

    const imgObj = await buildImageObj(req);

    if (imgObj && req.file && banner.image?.publicId) {
      await supabase.storage.from('products').remove([banner.image.publicId]);
    }

    const update = {
      ...req.body,
      ...(imgObj ? { imageUrl: imgObj.url, image: imgObj } : {}),
    };
    delete update.imageUrl; // will be re-set above

    const updated = await Banner.findByIdAndUpdate(req.params.id, {
      ...req.body,
      ...(imgObj ? { imageUrl: imgObj.url, image: imgObj } : {}),
    }, { new: true, runValidators: false });
    res.status(200).json({ success: true, banner: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    if (banner.image?.publicId) await supabase.storage.from('products').remove([banner.image.publicId]);
    await banner.deleteOne();
    res.status(200).json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

