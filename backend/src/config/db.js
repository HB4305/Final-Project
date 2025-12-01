const mongoose = require('mongoose');

// Hàm kết nối
const connectDB = async () => {
    try {
        // Lấy chuỗi kết nối từ file .env
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Dừng chương trình nếu lỗi
    }
};

module.exports = connectDB;