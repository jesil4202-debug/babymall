// ⚠️ IMPORTANT: Only load .env in development. Render provides env vars directly.
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  const result = dotenv.config();
  if (result.error && result.error.code !== 'ENOENT') {
    console.warn('⚠️  Warning: .env file not found (OK in production):', result.error.message);
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ✅ Diagnostic: Log critical environment variables at startup
const logEnvDiagnostics = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.log('\n🔧 Environment Diagnostics:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
  console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('  BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
  
  // Show admin emails
  const adminEmails = (process.env.ADMIN_EMAILS || 'jesil4202@gmail.com').split(',').map(e => e.trim());
  console.log('  ADMIN_EMAILS:', adminEmails.length > 0 ? `✅ ${adminEmails.join(', ')}` : '❌ NOT SET');
  console.log('');
  
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ CRITICAL: Email service configuration is missing!');
    console.error('   On Render: Dashboard → Environment');
    console.error('   Required: BREVO_API_KEY, EMAIL_FROM');
    console.error('   Get API key from: https://app.brevo.com/settings/account/api');
  }
};

// Routes
const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const bannerRoutes = require('./routes/banners');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');
const invoiceRoutes = require('./routes/invoice');

const app = express();

// ✅ Run environment diagnostics
logEnvDiagnostics();

// Connect Database
connectDB();

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  keyGenerator: rateLimit.ipKeyGenerator,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Baby Mall API is running 🍼', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth/otp', otpRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api', testRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Baby Mall API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
