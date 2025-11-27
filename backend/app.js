const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const cors = require('cors'); // Cần cài thêm cái này để Frontend gọi được

// Import Routes
const productRoutes = require('./src/routes/productRoutes.js');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors()); // Cho phép Frontend (React) gọi API
app.use(express.json());

// --- SỬ DỤNG ROUTES ---
app.use('/api/products', productRoutes);
// ----------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port at ${PORT}`);
});