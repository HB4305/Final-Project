import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import bidRoutes from './routes/bid.js';
import auctionRoutes from './routes/auction.js';
import ratingRoutes from './routes/rating.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middeware: Body Parser & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/ratings', ratingRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (PHẢI CÓ CUỐI CÙNG)
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
});
