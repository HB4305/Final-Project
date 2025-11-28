import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/database.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import bidRoutes from "./routes/bid.js";
import auctionRoutes from "./routes/auction.js";
import ratingRoutes from "./routes/rating.js";
// API 1.1 - 1.5: Product & Category Routes
import categoryRoutes from "./routes/category.js";
import productRoutes from "./routes/product.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middeware: Body Parser & Cookie Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/ratings", ratingRoutes);
// API 1.1 - 1.5: Product & Category endpoints
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (PHẢI CÓ CUỐI CÙNG)
app.use(errorHandler);

// Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Local host: http://localhost:${PORT}`);
  });
}

startServer();
