import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import expressEjsLayouts from 'express-ejs-layouts';
import session from 'express-session';
import connectDB from './config/database.js';

// Import Routes
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import userAuthRoutes from './routes/userAuthRoutes.js';
import shopRoutes from './routes/shopRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// =====================
// EJS Template Engine Setup
// =====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressEjsLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'bedentist-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeDentist API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userAuthRoutes); // User authentication & profile

// =====================
// Admin Panel Routes (EJS) - Separate Layout
// =====================
app.use('/super-admin', superAdminRoutes);

// =====================
// Frontend Routes (EJS with site-layout)
// All pages now use EJS templating - MUST BE BEFORE STATIC FILES
// =====================
app.use('/', shopRoutes);

// =====================
// Static Files (CSS, Images, JS)
// index: false prevents serving index.html for / route
// =====================
app.use(express.static(path.join(__dirname, '..'), { index: false }));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));

// =====================
// Redirect .html URLs to EJS routes
// =====================
app.get('/products.html', (req, res) => res.redirect('/products'));
app.get('/home.html', (req, res) => res.redirect('/'));
app.get('/about-us.html', (req, res) => res.redirect('/about-us'));
app.get('/contact.html', (req, res) => res.redirect('/contact'));
app.get('/healing.html', (req, res) => res.redirect('/healing'));
app.get('/technologies.html', (req, res) => res.redirect('/technologies'));
app.get('/track-order.html', (req, res) => res.redirect('/track-order'));
app.get('/user-login.html', (req, res) => res.redirect('/user-login'));
app.get('/cart.html', (req, res) => res.redirect('/cart'));

// =====================
// Legacy Static HTML Routes (Product Detail, Assignments)
// =====================
app.get('/product-detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'product-detail.html'));
});

app.get('/assignments', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Assignment Routes
app.get('/Assignment1-Checkout-Page/checkout.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Assignment1-Checkout-Page', 'checkout.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Assignment1-Checkout-Page', 'checkout.html'));
});

app.get('/Assignment2-Single%20Page%20CRUD%20App/patient-manager.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Assignment2-Single Page CRUD App', 'patient-manager.html'));
});

app.get('/patient-manager', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Assignment2-Single Page CRUD App', 'patient-manager.html'));
});

app.get('/Lab-Task1/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Lab-Task1', 'index.html'));
});

app.get('/lab-task1', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Lab-Task1', 'index.html'));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🦷 BeDentist Server running on http://localhost:${PORT}`);
  console.log(`\n📄 Frontend Pages (EJS with site-layout):`);
  console.log(`   Home: http://localhost:${PORT}/`);
  console.log(`   Products: http://localhost:${PORT}/products`);
  console.log(`   About Us: http://localhost:${PORT}/about-us`);
  console.log(`   Contact: http://localhost:${PORT}/contact`);
  console.log(`   Healing: http://localhost:${PORT}/healing`);
  console.log(`   Technologies: http://localhost:${PORT}/technologies`);
  console.log(`   Track Order: http://localhost:${PORT}/track-order`);
  console.log(`   User Login: http://localhost:${PORT}/user-login`);
  console.log(`   Cart: http://localhost:${PORT}/cart`);
  console.log(`\n👑 Admin Panel (EJS with admin-layout):`);
  console.log(`   Login: http://localhost:${PORT}/super-admin/login`);
  console.log(`   Dashboard: http://localhost:${PORT}/super-admin`);
  console.log(`   Products CRUD: http://localhost:${PORT}/super-admin/products`);
  console.log(`   Categories: http://localhost:${PORT}/super-admin/categories`);
  console.log(`   Orders: http://localhost:${PORT}/super-admin/orders`);
  console.log(`   Users: http://localhost:${PORT}/super-admin/users`);
  console.log(`\n📦 API Endpoints:`);
  console.log(`   Products: http://localhost:${PORT}/api/products`);
  console.log(`   Orders: http://localhost:${PORT}/api/orders`);
  console.log(`   User Auth: http://localhost:${PORT}/api/user`);
});

