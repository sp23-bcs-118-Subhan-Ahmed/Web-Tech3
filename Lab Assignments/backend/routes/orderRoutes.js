import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all orders (Admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('productId').sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track order by order number
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found. Please check your order number.' });
    }
    
    // Return limited info for tracking
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

