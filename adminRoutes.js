const express = require('express');
const multer = require('multer'); // for handling file uploads
const { User } = require('../../models/userModel');

const {Vendor} = require("../../models/vendorModel");
const {Product} = require("../../models/productModel"); // Import the User model
const router = express.Router();


const upload = multer({ dest: 'uploads/' });

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
    try {
        if (req.session.userId) {
            // Retrieve the user from the database
            const user = await User.findByPk(req.session.userId);

            // Check if the user has the admin role
            if (user && user.role === 'admin') {
                req.user = user; // Attach the user object to the request
                return next();
            }
        }
        res.status(403).send('Unauthorized access');
    } catch (err) {
        console.error('Error checking admin role:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Use the middleware for all routes in this file
router.use(isAdmin);

// Admin dashboard route
router.get('/dashboard', (req, res) => {
    res.render('admin', { user: req.user }); // Pass the user object to the admin.ejs view
});


// Route to render the "Add New Product" page
router.get('/newproduct', async (req, res) => {
    console.log('This Route');
    try {
        // Fetch all vendors from the database
        const vendors = await Vendor.findAll();

        // Categories are fixed, so we can define them here
        const categories = [
            "Bhakhri", "Biscuits", "Flour", "Herbal",
            "Instant Mix", "Spices", "Snacks"
        ];

        // Render the page, passing both vendors and categories
        res.render('newproduct', { vendors, categories });
    } catch (err) {
        console.error('Error fetching vendors:', err);
        res.status(500).send('Error fetching vendors');
    }
});



router.post('/newproduct', upload.single('product_image'), async (req, res) => {
    const { product_name, product_category, product_details, product_price, vendor_id } = req.body;
    const product_image = req.file ? req.file.path : null; // Handle file upload

    try {
        // Create a new product entry in the database
        const newProduct = await Product.create({
            product_name,
            product_category,
            product_details,
            product_price,
            vendor_id,
            image_url: product_image, // Store image URL if uploaded
        });

        // Redirect to a success page (or back to the product list)
        res.redirect('/admin/allproducts'); // Modify this according to your setup
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).send('Error adding product');
    }
});


// Route to fetch all products for admin
router.get('/allproducts', async (req, res) => {
    try {
        const products = await Product.findAll(); // Fetch all products
        res.render('allproducts', { products }); // Render the view and pass products
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send('Error fetching products');
    }
});

module.exports = router;
