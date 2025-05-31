const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Place a new order
router.post('/', auth, async (req, res) => {
  const { items, total, address } = req.body;

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!total || total <= 0) {
      return res.status(400).json({ message: 'Total must be a positive number' });
    }
    if (!address || !address.street || !address.city || !address.state || !address.zip || !address.country) {
      return res.status(400).json({ message: 'Complete address is required' });
    }

    for (const item of items) {
      if (!item.productId || !/^[0-9a-fA-F]{24}$/.test(item.productId)) {
        return res.status(400).json({ message: 'Invalid product ID in order items' });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        return res.status(400).json({ message: 'Price must be a non-negative number' });
      }
    }

    const order = new Order({
      userId: req.user.id,
      items,
      total,
      address,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: 'Server error while placing order' });
  }
});

// Get user's order history
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

module.exports = router;