/**
 * @fileoverview Order Model - Mongoose schema for customer orders
 * @description Defines the data structure for orders in the BeDentist store
 * 
 * Features:
 *   - Auto-generated order numbers (format: BDYYMM####)
 *   - Order tracking with status history
 *   - Multiple payment methods support (COD, bank transfer, mobile wallets)
 *   - Customer and shipping information
 *   - Automatic timestamps
 * 
 * @requires mongoose - MongoDB ODM library
 */

import mongoose from 'mongoose';

/**
 * Order Schema Definition
 * @typedef {Object} Order
 * @property {string} orderNumber - Unique auto-generated order ID (BDYYMM####)
 * @property {string} customerName - Full name of the customer
 * @property {string} customerEmail - Customer email for notifications
 * @property {string} customerPhone - Customer phone number
 * @property {string} shippingAddress - Full shipping address
 * @property {ObjectId} productId - Reference to Product document
 * @property {string} productName - Product name (denormalized for quick access)
 * @property {number} quantity - Number of items ordered
 * @property {number} amount - Total order amount
 * @property {string} paymentMethod - Payment method used
 * @property {string} paymentStatus - Payment verification status
 * @property {string} orderStatus - Current order fulfillment status
 * @property {Array} trackingHistory - Array of status changes with timestamps
 */
const orderSchema = new mongoose.Schema(
  {
    // Auto-generated unique order identifier
    orderNumber: {
      type: String,
      unique: true,
    },
    
    // =====================
    // Customer Information
    // =====================
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
    },
    shippingAddress: {
      type: String,
      required: [true, 'Shipping address is required'],
    },
    
    // =====================
    // Product Details
    // =====================
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',  // References the Product model
      required: [true, 'Product ID is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    
    // =====================
    // Payment Details
    // =====================
    amount: {
      type: Number,
      required: [true, 'Order amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank-transfer', 'easypaisa', 'jazzcash'],
      default: 'cod'  // Cash on Delivery is default
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    paymentProof: {
      type: String,  // URL to uploaded payment screenshot
    },
    transactionId: {
      type: String,  // Transaction reference from payment gateway
    },
    
    // =====================
    // Order Status
    // =====================
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    
    // =====================
    // Tracking Information
    // =====================
    trackingNumber: {
      type: String,  // Courier tracking number
    },
    trackingHistory: [{
      status: String,      // Status at this point
      message: String,     // Human-readable status message
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    // =====================
    // Admin Management
    // =====================
    adminNotes: {
      type: String,  // Internal notes (not shown to customer)
    },
    estimatedDelivery: {
      type: Date,    // Expected delivery date
    }
  },
  {
    timestamps: true,  // Adds createdAt and updatedAt automatically
  }
);

/**
 * Pre-save middleware to generate order number
 * Format: BD + YY + MM + 4 random digits (e.g., BD2412-1234)
 * Also initializes tracking history for new orders
 */
orderSchema.pre('save', async function (next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `BD${year}${month}${random}`;
  }
  
  // Add initial tracking history entry for new orders
  if (this.trackingHistory.length === 0) {
    this.trackingHistory.push({
      status: 'pending',
      message: 'Order placed successfully',
      timestamp: new Date()
    });
  }
  
  next();
});

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);
export default Order;

