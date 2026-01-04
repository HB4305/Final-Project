import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Auction from './models/Auction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function seedNewProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] Connected to MongoDB');

    const seller = await User.findOne({ filter: { roles: 'seller' } }); // Find any seller
    if (!seller) {
        console.log('No seller found, skipping.');
        process.exit(0);
    }
    
    // Find new categories
    const xeco = await Category.findOne({ slug: 'xe-co' });
    const bds = await Category.findOne({ slug: 'bat-dong-san' });
    const suutam = await Category.findOne({ slug: 'suu-tam' });

    const productsData = [];

    if (xeco) {
         productsData.push({
             title: 'VinFast VF9 Plus', slug: 'vinfast-vf9', 
             catId: xeco._id,
             img: 'https://images.unsplash.com/photo-1678853177659-3a13781c1cde?w=500',
             startPrice: 1500000000
         });
    }
    if (bds) {
         productsData.push({
             title: 'Căn hộ Landmark 81', slug: 'can-ho-landmark-81', 
             catId: bds._id,
             img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500',
             startPrice: 5000000000
         });
    }
    if (suutam) {
         productsData.push({
             title: 'Bộ sưu tập tem cổ', slug: 'tem-co', 
             catId: suutam._id,
             img: 'https://images.unsplash.com/photo-1579761596280-575ba0236401?w=500',
             startPrice: 5000000
         });
    }

    for (const p of productsData) {
         const product = await Product.create({
              sellerId: seller._id,
              categoryId: p.catId,
              title: p.title,
              slug: `${p.slug}-${Date.now()}`,
              descriptionHistory: [{ text: `Sản phẩm ${p.title} mới nhất.`, createdAt: new Date(), authorId: seller._id }],
              primaryImageUrl: p.img,
              imageUrls: [p.img],
              isActive: true,
              baseCurrency: 'VND'
         });
         
         // Create Auction
         const startPrice = p.startPrice;
         await Auction.create({
             productId: product._id,
             sellerId: seller._id,
             startPrice: startPrice,
             currentPrice: startPrice,
             bidCount: 0,
             buyNowPrice: startPrice * 1.5,
             priceStep: startPrice / 100,
             startAt: new Date(),
             endAt: new Date(Date.now() + 72 * 3600 * 1000), // 3 days
             status: 'active',
             autoExtendEnabled: true
         });
         console.log(`Created product: ${p.title}`);
    }

    console.log('[SEED] New products added successfully');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exit(1);
  }
}

seedNewProducts();
