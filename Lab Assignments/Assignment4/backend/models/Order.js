import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    
    // Customer Information
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    
    // Product Details
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    
    // Payment Details
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank-transfer', 'easypaisa', 'jazzcash'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    paymentProof: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    
    // Order Status
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    
    // Tracking
    trackingNumber: {
      type: String,
    },
    trackingHistory: [{
      status: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Admin Notes
    adminNotes: {
      type: String,
    },
    
    // Estimated Delivery
    estimatedDelivery: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

// Generate Order Number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `BD${year}${month}${random}`;
  }
  
  // Add initial tracking history
  if (this.trackingHistory.length === 0) {
    this.trackingHistory.push({
      status: 'pending',
      message: 'Order placed successfully',
      timestamp: new Date()
    });
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;

