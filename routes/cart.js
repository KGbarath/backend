const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// Add item to cart
router.post('/', auth, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (cart) {
      // Cart exists, update it
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        // Item exists in cart, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Item doesn't exist, add new item
        cart.items.push({ productId, quantity });
      }
    } else {
      // No cart exists, create a new one
      cart = new Cart({
        userId: req.user.id,
        items: [{ productId, quantity }],
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.productId');
    res.status(201).json(cart);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error while adding to cart' });
  }
});

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error while fetching cart' });
  }
});

// Update item quantity
router.put('/', auth, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.productId');
    res.status(200).json(cart);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error while updating cart' });
  }
});

// Remove item from cart
router.delete('/:productId', auth, async (req, res) => {
  const { productId } = req.params;

  try {
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.productId');
    res.status(200).json(cart);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error while removing from cart' });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    await Cart.deleteOne({ userId: req.user.id });
    res.status(200).json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error while clearing cart' });
  }
});

module.exports = router;