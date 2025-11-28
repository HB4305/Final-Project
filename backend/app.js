const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const cors = require("cors");
const helmet = require("helmet"); // Thư viện bảo mật HTTP headers

// Import Routes
const productRoutes = require("./routes/product");
const uploadRoutes = require("./routes/upload");
const categoryRoutes = require("./routes/category");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

dotenv.config();
connectDB();

const app = express();

// 1. Cấu hình CORS (Quan trọng để Frontend gọi được API)
// Cho phép frontend ở port 5173 (Vite default) gửi cookie và request lên
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// 2. Cấu hình Security Headers (Fix lỗi CSP chặn Google Font & ReCaptcha)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      // Cho phép script chạy từ chính domain này và Google (cho ReCaptcha)
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://www.google.com",
        "https://www.gstatic.com",
      ],
      // Cho phép style (CSS) từ chính domain và Google Fonts
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      // Cho phép tải font file từ Google
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      // Cho phép load ảnh từ các nguồn
      "img-src": ["'self'", "data:", "https:"],
      // Cho phép kết nối API (fetch/axios) tới localhost và Google
      "connect-src": [
        "'self'",
        "http://localhost:3000",
        "https://www.google.com",
        "https://www.gstatic.com",
      ],
      // Cho phép hiển thị iframe của Google ReCaptcha
      "frame-src": ["'self'", "https://www.google.com"],
    },
  })
);

// Middleware xử lý JSON và Static files
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// 3. Route trang chủ (Fix lỗi 404 Not Found khi truy cập http://localhost:3000)
app.get("/", (req, res) => {
  res.send("API Auction Hub is running...");
});

// Routes API
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
