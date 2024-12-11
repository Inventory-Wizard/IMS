const express = require('express');
const multer = require('multer'); // for handling file uploads
const { User } = require('../../models/userModel');
const { Order } = require('../../models/orderModel'); // Adjust based on your setup
const {Vendor} = require("../../models/vendorModel");
const {Product} = require("../../models/productModel"); // Import the User model
const {OrderItem} = require("../../models/orderItemsModel"); // Import the User model
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

// Route to fetch pending orders
router.get('/pendingorders', async (req, res) => {
    try {
        const pendingOrders = await Order.findAll({ where: { status: 'P' } });
        res.render('pendingorders', { orders: pendingOrders });
    } catch (err) {
        console.error('Error fetching pending orders:', err);
        res.status(500).send('Error fetching pending orders');
    }
});

// Route to fetch completed orders
router.get('/completedorders', async (req, res) => {
    try {
        const completedOrders = await Order.findAll({ where: { status: 'D' } });
        res.render('completedorders', { orders: completedOrders });
    } catch (err) {
        console.error('Error fetching completed orders:', err);
        res.status(500).send('Error fetching completed orders');
    }
});


// Route to fetch completed orders
router.get('/cancelledorders', async (req, res) => {
    try {
        const completedOrders = await Order.findAll({ where: { status: 'C' } });
        res.render('cancelledorders', { orders: completedOrders });
    } catch (err) {
        console.error('Error fetching completed orders:', err);
        res.status(500).send('Error fetching completed orders');
    }
});

// Mark an order as completed
router.post('/markOrderCompleted/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Update the order status to 'D' (Delivered/Completed)
        await Order.update({ status: 'D' }, { where: { order_id: id } });
        res.redirect('/admin/pendingorders'); // Redirect back to the Pending Orders page
    } catch (err) {
        console.error('Error updating order status to completed:', err);
        res.status(500).send('Error marking order as completed');
    }
});


// Cancel an order
router.post('/cancelOrder/:id', async (req, res) => {
    console.log('In the cancelled route');
    const { id } = req.params;
    try {
        // Update the order status to 'C' (Cancelled)
        await Order.update({ status: 'C' }, { where: { order_id: id } });
        res.redirect('/admin/pendingorders'); // Redirect back to the Pending Orders page
    } catch (err) {
        console.error('Error updating order status to cancelled:', err);
        res.status(500).send('Error cancelling order');
    }
});



// GET route to display the update product form
router.get('/updateproduct/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the product to be updated
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Fetch all vendors for the dropdown
        const vendors = await Vendor.findAll();

        // Categories are now dynamically fetched from the product itself
        const categories = [
            "Bhakhri", "Biscuits", "Flour", "Herbal",
            "Instant Mix", "Spices", "Snacks"
        ]; // You can also dynamically fetch this if needed from another source

        // Render the update form with product data
        res.render('updateproduct', {
            product,
            vendors,
            categories
        });

    } catch (err) {
        console.error('Error fetching product for update:', err);
        res.status(500).send('Something went wrong.');
    }
});


// POST route to handle product updates
router.post('/updateproduct/:id', upload.single('product_image'), async (req, res) => {
    const { id } = req.params;
    const { product_name, product_category, product_details, product_price, vendor_id } = req.body;

    // Check if the file exists, and if so, set the image_url
    const image_url = req.file ? req.file.filename : null; // If an image was uploaded, get the filename

    console.log('this route explored');
    console.log(req.body); // Log the data to check if everything is passed correctly
    console.log(req.file); // Log the uploaded file information

    try {
        // Find the product to be updated
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Update the product details
        await product.update({
            product_name,
            product_category,
            product_details,
            product_price,
            vendor_id,
            image_url // Only update the image if a new one is uploaded
        });

        // Redirect to the products page (or anywhere you prefer)
        res.redirect('/admin/allproducts');  // Adjust the redirect path as needed

    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send('Error updating product');
    }
});


// View Order Products Route
// In your route for viewing order products (adminRoutes.js or similar)
router.get('/viewOrderProducts/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        // Fetch the order items (products) associated with the order
        const orderItems = await OrderItem.findAll({
            where: { order_id: orderId },
            include: [
                {
                    model: Product,
                    as: 'product',  // Ensure to use the alias 'product' here
                    attributes: ['product_name', 'product_price'],
                }
            ],
        });

        if (!orderItems.length) {
            return res.status(404).send('No products found for this order');
        }

        // Render the order products page with the order items data and orderId
        res.render('orderProducts', { orderItems, orderId });

    } catch (err) {
        console.error("Error fetching order products:", err);
        res.status(500).send('Error fetching order products');
    }
});



module.exports = router;
