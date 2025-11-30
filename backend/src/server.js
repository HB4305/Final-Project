import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import { connectDB } from "./lib/database.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import bidRoutes from "./routes/bid.js";
import auctionRoutes from "./routes/auction.js";
import ratingRoutes from "./routes/rating.js";
import userRoutes from "./routes/user.js";
// API 1.1 - 1.5: Product & Category Routes
import categoryRoutes from "./routes/category.js";
import productRoutes from "./routes/product.js";
// User Profile Management Routes
import watchlistRoutes from "./routes/watchlist.js";
import userAuctionRoutes from "./routes/userAuction.js";
import transactionRoutes from "./routes/transaction.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration - Cho phép frontend kết nối
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);

// Middeware: Body Parser & Cookie Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Session middleware for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport (only if Google OAuth is configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const passportModule = await import("./config/passport.js");
  const passport = passportModule.default;
  app.use(passport.initialize());
  app.use(passport.session());
  console.log("✅ Passport.js initialized with Google OAuth");
} else {
  console.log("⚠️  Google OAuth not configured - Social login disabled");
}

// Root route - API Info
app.get("/", (req, res) => {
  res.json({
    message: "🎉 AuctionHub API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      categories: "/api/categories",
      auctions: "/api/auctions",
      bids: "/api/bids",
      ratings: "/api/ratings",
      watchlist: "/api/watchlist",
      userAuctions: "/api/user/auctions",
      transactions: "/api/transactions",
    },
    documentation: "See AUTHENTICATION_FLOW_DOCUMENTATION.md for details",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/users", userRoutes);
// API 1.1 - 1.5: Product & Category endpoints
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
// User Profile Management Routes
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/user/auctions", userAuctionRoutes);
app.use("/api/transactions", transactionRoutes);

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
