// authRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const authController = require('../controllers/authController');
const {Product} = require("../models/productModel");

// Render the register page
router.get('/register', (req, res) => {
    res.render('register'); // This renders views/register.ejs
});

// Render the login page
router.get('/login', (req, res) => {
    res.render('login'); // This renders views/login.ejs
});


// In your home page route (for example, '/home')
router.get('/home', async (req, res) => {
    const cart = req.session.cart || [];  // Fetch the cart from session (or empty array if no cart exists)

    // Get all the product IDs in the cart
    const productIds = cart.map(item => item.productId);

    try {

        const allProducts = await Product.findAll()
        const products = await Product.findAll({
            where: { product_id: productIds }
        });

        // Map over the cart to add product details to each cart item
        const cartWithDetails = cart.map(item => {
            const product = products.find(p => p.product_id === item.productId);
            return {
                ...item,
                product_name: product ? product.product_name : 'Unknown Product',
                product_price: product ? parseFloat(product.product_price) : 0  // Ensure it's a number
            };
        });

        // Render the home page (or any page where you're displaying the cart) with the product details included
        res.render('home', { allProducts, cart: cartWithDetails });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Something went wrong while fetching product details.');
    }
});



// Route to handle registration form submission
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

module.exports = router;
