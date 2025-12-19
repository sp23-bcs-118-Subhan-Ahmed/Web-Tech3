import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

const router = express.Router();

// =====================
// Frontend Pages (EJS with site-layout)
// =====================

// GET / - Homepage
router.get('/', (req, res) => {
  res.render('site/home', {
    layout: 'layouts/site-layout',
    title: 'Home',
    activePage: 'home',
    user: req.session.user || null
  });
});

// GET /home - Homepage alias
router.get('/home', (req, res) => {
  res.redirect('/');
});

// GET /products - Products page
router.get('/products', (req, res) => {
  res.render('site/products', {
    layout: 'layouts/site-layout',
    title: 'Products',
    activePage: 'products',
    user: req.session.user || null
  });
});

// GET /about-us - About page
router.get('/about-us', (req, res) => {
  res.render('site/about', {
    layout: 'layouts/site-layout',
    title: 'About Us',
    activePage: 'about',
    user: req.session.user || null
  });
});

// GET /healing - Healing page
router.get('/healing', (req, res) => {
  res.render('site/healing', {
    layout: 'layouts/site-layout',
    title: 'Healing',
    activePage: 'healing',
    user: req.session.user || null
  });
});

// GET /technologies - Technologies page
router.get('/technologies', (req, res) => {
  res.render('site/technologies', {
    layout: 'layouts/site-layout',
    title: 'Technologies',
    activePage: 'technologies',
    user: req.session.user || null
  });
});

// GET /contact - Contact page
router.get('/contact', (req, res) => {
  res.render('site/contact', {
    layout: 'layouts/site-layout',
    title: 'Contact',
    activePage: 'contact',
    user: req.session.user || null
  });
});

// GET /track-order - Track order page
router.get('/track-order', (req, res) => {
  res.render('site/track-order', {
    layout: 'layouts/site-layout',
    title: 'Track Order',
    activePage: 'track',
    user: req.session.user || null
  });
});

// GET /user-login - User login page (without sidebar)
router.get('/user-login', (req, res) => {
  res.render('site/user-login', {
    layout: 'layouts/auth-layout',
    title: 'Login',
    user: req.session.user || null
  });
});

// GET /cart - Cart page
router.get('/cart', (req, res) => {
  res.render('site/cart', {
    layout: 'layouts/site-layout',
    title: 'Shopping Cart',
    activePage: 'cart',
    user: req.session.user || null
  });
});

// GET /login - Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.query.redirect || '/');
  }
  
  res.render('site/login', {
    layout: 'layouts/main-layout',
    title: 'Login',
    redirect: req.query.redirect || '',
    user: null
  });
});

// POST /login - Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password, redirect } = req.body;
    
    // Import User model
    const User = (await import('../models/User.js')).default;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('site/login', {
        layout: 'layouts/main-layout',
        title: 'Login',
        error: 'Invalid email or password',
        email,
        redirect,
        user: null
      });
    }
    
    // Check password (assuming bcrypt)
    const bcrypt = (await import('bcryptjs')).default;
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('site/login', {
        layout: 'layouts/main-layout',
        title: 'Login',
        error: 'Invalid email or password',
        email,
        redirect,
        user: null
      });
    }
    
    // Set session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      role: user.role || 'user'
    };
    
    // Redirect admin to admin panel, others to home or redirect URL
    if (user.isAdmin || user.role === 'admin') {
      res.redirect('/super-admin');
    } else {
      res.redirect(redirect || '/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('site/login', {
      layout: 'layouts/main-layout',
      title: 'Login',
      error: 'An error occurred during login',
      user: null
    });
  }
});

// GET /register - Registration page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('site/register', {
    layout: 'layouts/main-layout',
    title: 'Register',
    user: null
  });
});

// POST /register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.render('site/register', {
        layout: 'layouts/main-layout',
        title: 'Register',
        user: null,
        error: 'Passwords do not match'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('site/register', {
        layout: 'layouts/main-layout',
        title: 'Register',
        user: null,
        error: 'Email already registered'
      });
    }
    
    // Create user with plainPassword for admin viewing
    const user = new User({
      name: `${firstName} ${lastName}`,
      email,
      phone: phone || '',
      password,
      plainPassword: password, // Store for admin viewing
      isAdmin: false
    });
    
    await user.save();
    
    // Auto login after registration
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    };
    
    res.redirect('/?success=Registration successful! Welcome to BeDentist.');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('site/register', {
      layout: 'layouts/main-layout',
      title: 'Register',
      user: null,
      error: 'Registration failed. Please try again.'
    });
  }
});

// GET /logout - Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
});

// GET /about-us
router.get('/about-us', (req, res) => {
  res.render('pages/about', {
    layout: 'layouts/main-layout',
    title: 'About Us',
    user: req.session.user || null,
    isAdmin: req.session.user?.isAdmin || false
  });
});

// GET /healing
router.get('/healing', (req, res) => {
  res.render('pages/healing', {
    layout: 'layouts/main-layout',
    title: 'Healing',
    user: req.session.user || null,
    isAdmin: req.session.user?.isAdmin || false
  });
});

// GET /technologies
router.get('/technologies', (req, res) => {
  res.render('pages/technologies', {
    layout: 'layouts/main-layout',
    title: 'Technologies',
    user: req.session.user || null,
    isAdmin: req.session.user?.isAdmin || false
  });
});

// GET /contact
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    layout: 'layouts/main-layout',
    title: 'Contact',
    user: req.session.user || null,
    isAdmin: req.session.user?.isAdmin || false
  });
});

export default router;

