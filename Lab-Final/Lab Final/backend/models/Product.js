/**
 * @fileoverview Product Model - Mongoose schema for products
 * @description Defines the data structure for products in the BeDentist store
 * 
 * Features:
 *   - Required fields with validation (name, price)
 *   - Optional fields with defaults (stock, discount, rating)
 *   - Automatic timestamps (createdAt, updatedAt)
 *   - Support for multiple images
 *   - Featured product flag for homepage display
 * 
 * @requires mongoose - MongoDB ODM library
 */

import mongoose from 'mongoose';

/**
 * Product Schema Definition
 * @typedef {Object} Product
 * @property {string} name - Product name (required, max 200 chars)
 * @property {string} description - Full product description
 * @property {string} shortDescription - Brief description for cards
 * @property {string} image - Main product image URL
 * @property {string[]} images - Additional product images
 * @property {string} category - Product category name
 * @property {number} price - Current selling price (required)
 * @property {number} originalPrice - Original price before discount
 * @property {number} discount - Discount percentage (0-100)
 * @property {number} stock - Available inventory count
 * @property {boolean} inStock - Quick stock availability check
 * @property {boolean} featured - Show on homepage featured section
 * @property {boolean} isFeatured - Alias for featured flag
 * @property {number} rating - Average product rating (0-5)
 * @property {string[]} tags - Product tags for filtering
 * @property {boolean} isActive - Product visibility flag
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  image: {
    type: String,
    default: '/images/default-product.png'
  },
  images: [String],
  category: {
    type: String,
    default: 'Other'
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Create and export the Product model
const Product = mongoose.model('Product', productSchema);
export default Product;

