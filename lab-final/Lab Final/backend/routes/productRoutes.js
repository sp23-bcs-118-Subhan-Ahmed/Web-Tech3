/**
 * @fileoverview Product Routes - Handles all product-related API endpoints
 * @description Provides CRUD operations for products including:
 *   - Get all products with pagination, filtering, and sorting
 *   - Get product categories
 *   - Get single product by ID
 *   - Admin operations (create, update, delete)
 * 
 * @requires express - Web framework for Node.js
 * @requires ../models/Product.js - Mongoose Product model
 * @requires ../models/Category.js - Mongoose Category model
 */

import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

/**
 * @route GET /api/products/categories
 * @description Get all active product categories for frontend filter dropdown
 * @access Public
 * @returns {Object} JSON response with array of category objects sorted alphabetically
 */
router.get('/categories', async (req, res) => {
  try {
    // Only return active categories, sorted alphabetically by name
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/products
 * @description Get all products with pagination, filtering, and sorting
 * @access Public
 * 
 * @queryParam {string} [category='all'] - Filter by category name
 * @queryParam {string} [featured='false'] - Filter featured products only
 * @queryParam {string} [search] - Search in name and description
 * @queryParam {number} [page=1] - Page number for pagination
 * @queryParam {number} [limit=10] - Number of products per page
 * @queryParam {number} [minPrice] - Minimum price filter
 * @queryParam {number} [maxPrice] - Maximum price filter
 * @queryParam {string} [sortBy='createdAt'] - Field to sort by
 * @queryParam {string} [sortOrder='desc'] - Sort order (asc/desc)
 * 
 * @returns {Object} JSON with products array and pagination metadata
 */
router.get('/', async (req, res) => {
  try {
    // Destructure query parameters with defaults
    const { 
      category, 
      featured, 
      search, 
      page = 1, 
      limit = 10,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query object - only show active products
    let query = { isActive: true };
    
    // Category filter - skip if 'all' or not provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Featured filter - only apply if explicitly set to 'true'
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    // Search filter - case-insensitive regex search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Price range filter - validate numeric values
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(minPrice)) query.price.$gte = parseFloat(minPrice);
      if (maxPrice && !isNaN(maxPrice)) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Cap at 50
    const skip = (pageNum - 1) * limitNum;
    
    // Sort options - validate sortBy field
    const allowedSortFields = ['name', 'price', 'createdAt', 'rating'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = {};
    sortOptions[validSortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);
    
    // Get products with pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);
    
    // Return response with pagination metadata
    res.json({ 
      success: true, 
      products: products,
      data: products, // backward compatibility
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/products/:id
 * @description Get a single product by MongoDB ObjectId
 * @access Public
 * @param {string} req.params.id - Product MongoDB ObjectId
 * @returns {Object} JSON response with product data or 404 error
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Validates product data before creation/update
 * @param {Object} productData - Product data to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateProductData = (productData) => {
  const errors = [];

  if (!productData.name || productData.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters');
  }

  if (productData.price === undefined || productData.price < 0) {
    errors.push('Price must be a positive number');
  }

  if (productData.stock !== undefined && productData.stock < 0) {
    errors.push('Stock cannot be negative');
  }

  if (productData.discount !== undefined && (productData.discount < 0 || productData.discount > 100)) {
    errors.push('Discount must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * @route POST /api/products
 * @description Create a new product (Admin only)
 * @access Admin
 * @param {Object} req.body - Product data including name, price, etc.
 * @returns {Object} JSON response with created product or validation errors
 */
router.post('/', async (req, res) => {
  try {
    // Validate product data
    const validation = validateProductData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route PUT /api/products/:id
 * @description Update an existing product (Admin only)
 * @access Admin
 * @param {string} req.params.id - Product MongoDB ObjectId
 * @param {Object} req.body - Updated product data
 * @returns {Object} JSON response with updated product or error
 */
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete product (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

