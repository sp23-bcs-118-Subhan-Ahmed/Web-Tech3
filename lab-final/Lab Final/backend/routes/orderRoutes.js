/**
 * @fileoverview Order Routes - Handles all order-related API endpoints
 * @description Provides CRUD operations for orders including:
 *   - Create new orders with validation
 *   - Track orders by order number
 *   - Get orders by customer email
 *   - Admin operations (update status, delete)
 * 
 * @requires express - Web framework for Node.js
 * @requires ../models/Order.js - Mongoose Order model
 */

import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

/**
 * Validates email format using regex pattern
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (supports Pakistani numbers)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid, false otherwise
 */
const isValidPhone = (phone) => {
  // Accepts: 03001234567, +923001234567, 0300-1234567
  const phoneRegex = /^(\+92|0)?[3][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

/**
 * Validates order data before creation
 * @param {Object} orderData - Order data to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateOrderData = (orderData) => {
  const errors = [];

  // Required field validations
  if (!orderData.customerName || orderData.customerName.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters');
  }

  if (!orderData.customerEmail || !isValidEmail(orderData.customerEmail)) {
    errors.push('Valid email address is required');
  }

  if (!orderData.customerPhone || !isValidPhone(orderData.customerPhone)) {
    errors.push('Valid phone number is required (e.g., 03001234567)');
  }

  if (!orderData.shippingAddress || orderData.shippingAddress.trim().length < 10) {
    errors.push('Shipping address must be at least 10 characters');
  }

  if (!orderData.productId) {
    errors.push('Product ID is required');
  }

  if (!orderData.productName || orderData.productName.trim().length < 1) {
    errors.push('Product name is required');
  }

  if (!orderData.amount || orderData.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (orderData.quantity && orderData.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * @route POST /api/orders
 * @description Create a new order with validation
 * @access Public
 * @param {Object} req.body - Order data including customerName, customerEmail, etc.
 * @returns {Object} JSON response with created order or validation errors
 */
router.post('/', async (req, res) => {
  try {
    // Validate order data before creating
    const validation = validateOrderData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Sanitize input data - trim whitespace
    const sanitizedData = {
      ...req.body,
      customerName: req.body.customerName.trim(),
      customerEmail: req.body.customerEmail.trim().toLowerCase(),
      customerPhone: req.body.customerPhone.replace(/[-\s]/g, ''),
      shippingAddress: req.body.shippingAddress.trim()
    };

    const order = await Order.create(sanitizedData);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/orders
 * @description Get all orders (Admin only) - sorted by creation date descending
 * @access Admin
 * @returns {Object} JSON response with array of orders populated with product details
 */
router.get('/', async (req, res) => {
  try {
    // Populate productId to get full product details
    // Sort by createdAt descending to show newest orders first
    const orders = await Order.find().populate('productId').sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/orders/track/:orderNumber
 * @description Track order by order number - returns limited public info
 * @access Public
 * @param {string} req.params.orderNumber - Order number to track (case-insensitive)
 * @returns {Object} JSON response with order tracking info
 */
router.get('/track/:orderNumber', async (req, res) => {
  try {
    // Validate order number format
    const orderNumber = req.params.orderNumber.trim().toUpperCase();
    if (!orderNumber || orderNumber.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid order number' 
      });
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found. Please check your order number.' });
    }
    
    // Return limited info for tracking (security - don't expose full customer data)
    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        productName: order.productName,
        quantity: order.quantity,
        amount: order.amount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        trackingHistory: order.trackingHistory,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get orders by customer email
router.get('/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const orders = await Order.find({ 
      $or: [
        { email: email },
        { customerEmail: email },
        { 'customer.email': email }
      ]
    }).sort({ createdAt: -1 });
    
    // Transform orders to consistent format
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      items: order.items || [{ name: order.productName, quantity: order.quantity, price: order.amount }],
      total: order.total || order.amount || 0,
      status: order.orderStatus || order.status || 'pending',
      trackingNumber: order.trackingNumber || null,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress || order.address
    }));
    
    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { orderStatus, trackingNumber, adminNotes, estimatedDelivery } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Update fields
    if (orderStatus) {
      order.orderStatus = orderStatus;
      order.trackingHistory.push({
        status: orderStatus,
        message: getStatusMessage(orderStatus),
        timestamp: new Date()
      });
    }
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (adminNotes) order.adminNotes = adminNotes;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    
    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete order (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function for status messages
function getStatusMessage(status) {
  const messages = {
    pending: 'Order placed successfully',
    confirmed: 'Order has been confirmed',
    processing: 'Order is being processed',
    shipped: 'Order has been shipped',
    delivered: 'Order has been delivered',
    cancelled: 'Order has been cancelled'
  };
  return messages[status] || 'Order status updated';
}

export default router;

