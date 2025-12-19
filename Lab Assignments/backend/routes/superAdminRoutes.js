import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// ==================== ADMIN LOGIN (No Auth Required) ====================

// GET /super-admin/login - Admin Login Page
router.get('/login', (req, res) => {
  // If already logged in as admin, redirect to dashboard
  if (req.session.user && req.session.user.isAdmin) {
    return res.redirect('/super-admin');
  }
  
  res.render('super-admin/login', {
    layout: false, // No layout - standalone page
    title: 'Admin Login',
    error: req.query.error || null,
    success: req.query.success || null
  });
});

// POST /super-admin/login - Admin Login Handler
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.render('super-admin/login', {
        layout: false,
        title: 'Admin Login',
        error: 'Invalid email or password',
        email
      });
    }
    
    // Check if user is admin
    if (!user.isAdmin && user.role !== 'admin') {
      return res.render('super-admin/login', {
        layout: false,
        title: 'Admin Login',
        error: 'Access denied. Admin privileges required.',
        email
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('super-admin/login', {
        layout: false,
        title: 'Admin Login',
        error: 'Invalid email or password',
        email
      });
    }
    
    // Set session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || user.role === 'admin',
      isSuperAdmin: user.isSuperAdmin || false,
      role: user.role || 'admin'
    };
    
    // Redirect to dashboard
    res.redirect('/super-admin');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('super-admin/login', {
      layout: false,
      title: 'Admin Login',
      error: 'An error occurred. Please try again.'
    });
  }
});

// GET /super-admin/logout - Admin Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/super-admin/login?success=Logged out successfully');
  });
});

// ==================== ADMIN MIDDLEWARE (Applied to routes below) ====================

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.redirect('/super-admin/login');
  }
  next();
};

// Apply admin middleware to all routes below
router.use(isAdmin);


// GET /super-admin - Dashboard
router.get('/', async (req, res) => {
  try {
    const [productsCount, categoriesCount, ordersCount, usersCount, appointmentsCount, recentOrders, latestProducts] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.countDocuments({
        $or: [
          { orderType: 'appointment' },
          { productName: { $regex: /service|consultation|cleaning|whitening|session/i } }
        ]
      }),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Product.find().sort({ createdAt: -1 }).limit(5)
    ]);
    
    res.render('super-admin/dashboard', {
      layout: 'layouts/admin-layout',
      title: 'Dashboard',
      pageTitle: 'Dashboard',
      activePage: 'dashboard',
      productsCount,
      categoriesCount,
      ordersCount,
      usersCount,
      appointmentsCount,
      recentOrders,
      latestProducts,
      user: req.session.user
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('super-admin/dashboard', {
      layout: 'layouts/admin-layout',
      title: 'Dashboard',
      pageTitle: 'Dashboard',
      activePage: 'dashboard',
      productsCount: 0,
      categoriesCount: 0,
      ordersCount: 0,
      usersCount: 0,
      appointmentsCount: 0,
      recentOrders: [],
      latestProducts: [],
      user: req.session.user,
      error: 'Error loading dashboard data'
    });
  }
});

// ==================== PRODUCTS ====================

// GET /super-admin/products - List products
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      sort = { [req.query.sortBy]: 1 };
    }
    
    // Get products and unique categories from products
    const [products, productCategories, totalProducts] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.distinct('category'),
      Product.countDocuments(filter)
    ]);
    
    // Filter out empty categories
    const categories = productCategories.filter(c => c);
    
    const totalPages = Math.ceil(totalProducts / limit);
    
    res.render('super-admin/products/list', {
      layout: 'layouts/admin-layout',
      title: 'Products',
      pageTitle: 'Products',
      activePage: 'products',
      products,
      categories,
      totalProducts,
      totalPages,
      currentPage: page,
      search: req.query.search || '',
      selectedCategory: req.query.category || '',
      sortBy: req.query.sortBy || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Products list error:', error);
    res.redirect('/super-admin');
  }
});

// GET /super-admin/products/create - Create product form
router.get('/products/create', async (req, res) => {
  try {
    // Get unique categories from existing products
    const productCategories = await Product.distinct('category');
    const categories = productCategories.filter(c => c);
    
    // Add default categories if none exist
    const defaultCategories = ['Dental Products', 'Oral Care', 'Whitening', 'Accessories', 'Other'];
    defaultCategories.forEach(cat => {
      if (!categories.includes(cat)) {
        categories.push(cat);
      }
    });
    
    res.render('super-admin/products/create', {
      layout: 'layouts/admin-layout',
      title: 'Add Product',
      pageTitle: 'Add New Product',
      activePage: 'products',
      categories,
      user: req.session.user
    });
  } catch (error) {
    console.error('Create product form error:', error);
    res.redirect('/super-admin/products');
  }
});

// POST /super-admin/products/create - Create product
router.post('/products/create', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category, newCategory, features, imageUrl, featured, isActive } = req.body;
    
    // Use newCategory if provided, otherwise use selected category
    const finalCategory = newCategory && newCategory.trim() ? newCategory.trim() : (category || 'Other');
    
    // Default image
    let productImage = imageUrl || 'https://cdn-icons-png.flaticon.com/512/2767/2767815.png';
    
    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'bedentist/products',
          transformation: [{ width: 500, height: 500, crop: 'fill' }]
        });
        
        productImage = result.secure_url;
        console.log('Image uploaded to Cloudinary:', result.secure_url);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }
    
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category: finalCategory,
      image: productImage,
      features: features ? features.split('\n').filter(f => f.trim()) : [],
      featured: featured === 'on',
      isActive: isActive !== 'off'
    });
    
    await product.save();
    
    res.redirect('/super-admin/products?success=Product created successfully');
  } catch (error) {
    console.error('Create product error:', error);
    // Get categories for form re-render
    const productCategories = await Product.distinct('category');
    const categories = productCategories.filter(c => c);
    
    res.render('super-admin/products/create', {
      layout: 'layouts/admin-layout',
      title: 'Add Product',
      pageTitle: 'Add New Product',
      activePage: 'products',
      categories,
      product: req.body,
      error: 'Error creating product: ' + error.message,
      user: req.session.user
    });
  }
});

// GET /super-admin/products/edit/:id - Edit product form
router.get('/products/edit/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.redirect('/super-admin/products?error=Product not found');
    }
    
    // Get unique categories from existing products
    const productCategories = await Product.distinct('category');
    const categories = productCategories.filter(c => c);
    
    // Add default categories if none exist
    const defaultCategories = ['Dental Products', 'Oral Care', 'Whitening', 'Accessories', 'Other'];
    defaultCategories.forEach(cat => {
      if (!categories.includes(cat)) {
        categories.push(cat);
      }
    });
    
    res.render('super-admin/products/edit', {
      layout: 'layouts/admin-layout',
      title: 'Edit Product',
      pageTitle: 'Edit Product',
      activePage: 'products',
      product,
      categories,
      user: req.session.user
    });
  } catch (error) {
    console.error('Edit product form error:', error);
    res.redirect('/super-admin/products');
  }
});

// POST /super-admin/products/edit/:id - Update product
router.post('/products/edit/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category, newCategory, features, imageUrl, featured, isActive } = req.body;
    
    // Use newCategory if provided, otherwise use selected category
    const finalCategory = newCategory && newCategory.trim() ? newCategory.trim() : (category || 'Other');
    
    // Get current product to preserve existing values if needed
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.redirect('/super-admin/products?error=Product not found');
    }
    
    const updateData = {
      name: name || currentProduct.name,
      description: description || currentProduct.description,
      price: price && !isNaN(parseFloat(price)) ? parseFloat(price) : currentProduct.price,
      stock: stock && !isNaN(parseInt(stock)) ? parseInt(stock) : currentProduct.stock,
      category: finalCategory,
      features: features ? features.split('\n').filter(f => f.trim()) : currentProduct.features,
      featured: featured === 'on',
      isActive: isActive !== 'off'
    };
    
    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'bedentist/products',
          transformation: [{ width: 500, height: 500, crop: 'fill' }]
        });
        
        updateData.image = result.secure_url;
        console.log('Image uploaded to Cloudinary:', result.secure_url);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Continue with update even if image upload fails
      }
    } else if (imageUrl && imageUrl.trim()) {
      // Use provided image URL if no file uploaded
      updateData.image = imageUrl.trim();
    }
    
    await Product.findByIdAndUpdate(req.params.id, updateData);
    
    res.redirect('/super-admin/products?success=Product updated successfully');
  } catch (error) {
    console.error('Update product error:', error);
    res.redirect(`/super-admin/products/edit/${req.params.id}?error=Error updating product`);
  }
});

// POST /super-admin/products/delete/:id - Delete product
router.post('/products/delete/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/super-admin/products?success=Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    res.redirect('/super-admin/products?error=Error deleting product');
  }
});

// ==================== CATEGORIES ====================

// GET /super-admin/categories - List categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Get product count for each category (by category name)
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ 
          category: cat.name 
        });
        return {
          ...cat.toObject(),
          productCount
        };
      })
    );
    
    res.render('super-admin/categories/list', {
      layout: 'layouts/admin-layout',
      title: 'Categories',
      pageTitle: 'Categories',
      activePage: 'categories',
      categories: categoriesWithCount,
      user: req.session.user
    });
  } catch (error) {
    console.error('Categories list error:', error);
    res.redirect('/super-admin');
  }
});

// POST /super-admin/categories/create - Create category
router.post('/categories/create', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = new Category({ name, description });
    await category.save();
    
    res.redirect('/super-admin/categories?success=Category created successfully');
  } catch (error) {
    console.error('Create category error:', error);
    res.redirect('/super-admin/categories?error=Error creating category');
  }
});

// POST /super-admin/categories/delete/:id - Delete category
router.post('/categories/delete/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/super-admin/categories?success=Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    res.redirect('/super-admin/categories?error=Error deleting category');
  }
});

// ==================== ORDERS ====================

// GET /super-admin/orders - List orders
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalOrders / limit);
    
    res.render('super-admin/orders/list', {
      layout: 'layouts/admin-layout',
      title: 'Orders',
      pageTitle: 'Orders',
      activePage: 'orders',
      orders,
      totalOrders,
      totalPages,
      currentPage: page,
      selectedStatus: req.query.status || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Orders list error:', error);
    res.redirect('/super-admin');
  }
});

// POST /super-admin/orders/update-status/:id - Update order status
router.post('/orders/update-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { orderStatus: status });
    res.redirect('/super-admin/orders?success=Order status updated');
  } catch (error) {
    console.error('Update order status error:', error);
    res.redirect('/super-admin/orders?error=Error updating order status');
  }
});

// ==================== APPOINTMENTS ====================

// GET /super-admin/appointments - List all appointments (service bookings)
router.get('/appointments', async (req, res) => {
  try {
    // Get orders that are appointment/service type or have items with services
    const appointments = await Order.find({
      $or: [
        { orderType: 'appointment' },
        { productName: { $regex: /service|consultation|cleaning|whitening|session/i } }
      ]
    }).sort({ createdAt: -1 });
    
    res.render('super-admin/appointments/list', {
      layout: 'layouts/admin-layout',
      title: 'Appointments',
      pageTitle: 'Appointments & Bookings',
      activePage: 'appointments',
      appointments,
      user: req.session.user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Appointments list error:', error);
    res.redirect('/super-admin?error=Error loading appointments');
  }
});

// GET /super-admin/appointments/status/:id/:status - Update appointment status
router.get('/appointments/status/:id/:status', async (req, res) => {
  try {
    const { id, status } = req.params;
    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.redirect('/super-admin/appointments?error=Invalid status');
    }
    
    const order = await Order.findById(id);
    if (!order) {
      return res.redirect('/super-admin/appointments?error=Appointment not found');
    }
    
    // Update status
    order.orderStatus = status;
    
    // Add to tracking history
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: status,
      message: `Appointment ${status} by admin`,
      timestamp: new Date()
    });
    
    await order.save();
    
    res.redirect('/super-admin/appointments?success=Appointment ' + status + ' successfully');
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.redirect('/super-admin/appointments?error=Error updating appointment status');
  }
});

// ==================== USERS ====================

// GET /super-admin/users - List users
router.get('/users', async (req, res) => {
  try {
    // Check if current user is super admin (admin@bedentist.com)
    const isSuperAdmin = req.session.user && req.session.user.email === 'admin@bedentist.com';
    
    // Get all users - passwords are NEVER exposed (Security Best Practice)
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('super-admin/users/list', {
      layout: 'layouts/admin-layout',
      title: 'Users',
      pageTitle: 'Users',
      activePage: 'users',
      users,
      user: req.session.user,
      isSuperAdmin // Pass this to view for Reset Password button
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.redirect('/super-admin');
  }
});

// GET /super-admin/users/create - Create admin form
router.get('/users/create', (req, res) => {
  res.render('super-admin/users/create', {
    layout: 'layouts/admin-layout',
    title: 'Create Admin',
    pageTitle: 'Create New Admin',
    activePage: 'users',
    user: req.session.user
  });
});

// POST /super-admin/users/create - Create new admin
router.post('/users/create', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render('super-admin/users/create', {
        layout: 'layouts/admin-layout',
        title: 'Create Admin',
        pageTitle: 'Create New Admin',
        activePage: 'users',
        user: req.session.user,
        error: 'Passwords do not match',
        formData: { name, email, phone }
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('super-admin/users/create', {
        layout: 'layouts/admin-layout',
        title: 'Create Admin',
        pageTitle: 'Create New Admin',
        activePage: 'users',
        user: req.session.user,
        error: 'User with this email already exists',
        formData: { name, email, phone }
      });
    }
    
    // Create admin user (password will be hashed automatically by User model)
    await User.create({
      name,
      email,
      password, // Don't hash here - model's pre-save hook will hash it
      plainPassword: password, // Store plain password for super admin to view
      phone,
      role: 'admin',
      isAdmin: true
    });
    
    res.redirect('/super-admin/users?success=Admin created successfully');
  } catch (error) {
    console.error('Create admin error:', error);
    res.render('super-admin/users/create', {
      layout: 'layouts/admin-layout',
      title: 'Create Admin',
      pageTitle: 'Create New Admin',
      activePage: 'users',
      user: req.session.user,
      error: 'Error creating admin: ' + error.message
    });
  }
});

// POST /super-admin/users/toggle-admin/:id - Toggle admin status
router.post('/users/toggle-admin/:id', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (targetUser) {
      targetUser.isAdmin = !targetUser.isAdmin;
      targetUser.role = targetUser.isAdmin ? 'admin' : 'user';
      await targetUser.save();
    }
    res.redirect('/super-admin/users?success=User role updated');
  } catch (error) {
    console.error('Toggle admin error:', error);
    res.redirect('/super-admin/users?error=Error updating user role');
  }
});

// POST /super-admin/users/delete/:id - Delete user
router.post('/users/delete/:id', async (req, res) => {
  try {
    // Don't allow deleting self
    if (req.params.id === req.session.user.id) {
      return res.redirect('/super-admin/users?error=Cannot delete your own account');
    }
    
    // Check if trying to delete super admin
    const targetUser = await User.findById(req.params.id);
    if (targetUser && targetUser.email === 'admin@bedentist.com') {
      return res.redirect('/super-admin/users?error=Cannot delete Super Admin account');
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/super-admin/users?success=User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    res.redirect('/super-admin/users?error=Error deleting user');
  }
});

// POST /super-admin/users/reset-password/:id - Reset user password (Super Admin only)
router.post('/users/reset-password/:id', async (req, res) => {
  try {
    // Only super admin can reset passwords
    if (!req.session.user || req.session.user.email !== 'admin@bedentist.com') {
      return res.redirect('/super-admin/users?error=Only Super Admin can reset passwords');
    }
    
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.redirect('/super-admin/users?error=Password must be at least 6 characters');
    }
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.redirect('/super-admin/users?error=User not found');
    }
    
    // Don't allow resetting super admin password
    if (targetUser.email === 'admin@bedentist.com') {
      return res.redirect('/super-admin/users?error=Cannot reset Super Admin password');
    }
    
    // Update password (will be hashed by pre-save hook)
    // Note: Plain password is NEVER stored - Security Best Practice
    targetUser.password = newPassword;
    await targetUser.save();
    
    res.redirect('/super-admin/users?success=Password reset successfully for ' + targetUser.name);
  } catch (error) {
    console.error('Reset password error:', error);
    res.redirect('/super-admin/users?error=Error resetting password');
  }
});

export default router;

