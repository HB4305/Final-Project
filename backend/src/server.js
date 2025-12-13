import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import bidRoutes from './routes/bid.js';
import auctionRoutes from './routes/auction.js';
import ratingRoutes from './routes/rating.js';
import userAuctionRoutes from './routes/userAuction.js';
import userRoutes from './routes/user.js';
import watchlistRoutes from './routes/watchlist.js';
import categoryRoutes from './routes/category.js';
import productRoutes from './routes/product.js';
import questionRoutes from './routes/question.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Middeware: Body Parser & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/user/auctions', userAuctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/questions', questionRoutes);

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
