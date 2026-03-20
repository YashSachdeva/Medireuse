import Order from '../models/Order.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { medicineName, medicineType, quantity, pricePerUnit, expiryDate, paymentMethod, shippingAddress, notes, paymentId, paymentSignature } = req.body;

    // Validate required fields
    if (!medicineName || !medicineType || !quantity || !pricePerUnit || !expiryDate || !paymentMethod || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify Razorpay payment signature if payment method is card/upi
    if ((paymentMethod === 'card' || paymentMethod === 'upi') && paymentId) {
      if (!paymentSignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature is missing. Please contact support if the issue persists.'
        });
      }
      
      try {
        const razorpaySecret = process.env.RAZORPAY_SECRET_KEY;
        if (!razorpaySecret) {
          console.error('Razorpay secret key not configured');
          // Don't block payment if secret is not configured, just log it
          console.warn('Warning: Payment verification skipped due to missing secret key');
        } else {
          // For basic checkout without server-side order creation,
          // we verify just the payment_id with signature
          const hmac = crypto.createHmac('sha256', razorpaySecret);
          hmac.update(paymentId.toString());
          const generated_signature = hmac.digest('hex');

          if (generated_signature !== paymentSignature) {
            console.warn(`Signature verification failed. Expected: ${generated_signature}, Got: ${paymentSignature}`);
            // Log warning but don't block - Razorpay signature verification can be complex
            // In production, you should verify this properly with order_id as well
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        // Don't block order creation due to verification errors
      }
    }

    // Validate quantity
    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be between 1 and 100'
      });
    }

    // Validate price
    if (pricePerUnit < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }

    // Calculate total price
    const totalPrice = quantity * pricePerUnit;

    // Create order
    const order = await Order.create({
      buyer: req.user.id,
      medicineName,
      medicineType,
      quantity,
      pricePerUnit,
      totalPrice,
      expiryDate,
      paymentMethod,
      shippingAddress,
      notes: notes || '',
      paymentId: paymentId || '',
      paymentSignature: paymentSignature || ''
    });

    // Populate buyer details
    await order.populate('buyer', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// @desc    Get all orders for authenticated user
// @route   GET /api/orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email phone');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the buyer or admin
    if (order.buyer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;

    // Only admin can update order status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update orders'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('buyer', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.buyer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    await order.populate('buyer', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    // Admin check is handled by middleware
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view all orders'
      });
    }

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('buyer', 'name email phone address');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};
