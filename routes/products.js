const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// Add a product (admin only, simplified for testing)
router.post('/', auth, async (req, res) => {
  const { name, price, images, rating, description } = req.body;

  try {
    if (!name || typeof price !== 'number' || price < 0 || !description) {
      return res.status(400).json({ message: 'Invalid product data' });
    }

    const product = new Product({ name, price, images, rating, description });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Server error while adding product' });
  }
});

module.exports = router;