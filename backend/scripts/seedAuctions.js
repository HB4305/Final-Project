import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Auction from '../src/models/Auction.js';
import Category from '../src/models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Richer Product Data with real Unsplash Image IDs
const productsData = [
  {
    title: "Sony WH-1000XM5 Noise Canceling Headphones",
    slug: "sony-wh-1000xm5-headphones",
    description: "Experience world-class noise cancellation and audio quality. The Sony WH-1000XM5 headphones feature a newly developed driver and 8 microphones for crystal clear sound and calls. Perfect for travel, work, or specialized listening.",
    startingPrice: 5000000,
    categoryName: "Điện tử",
    condition: "new",
    buyNowPrice: 8500000,
    images: [
        "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "MacBook Pro 16-inch M3 Max",
    slug: "macbook-pro-16-m3-max",
    description: "The ultimate pro laptop. M3 Max chip with 16-core CPU and 40-core GPU. 48GB Unified Memory, 1TB SSD. Space Black finish. Handles the most demanding workflows with ease.",
    startingPrice: 60000000,
    categoryName: "Điện tử",
    condition: "new",
    buyNowPrice: 90000000,
    images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "Vintage 1960s Omega Seamaster",
    slug: "vintage-omega-seamaster-1960s",
    description: "A beautiful, fully serviced vintage Omega Seamaster from the 1960s. Gold plated case with minimal wear. Automatic movement running perfectly key. Original dial with lovely patina.",
    startingPrice: 12000000,
    categoryName: "Sưu tầm",
    condition: "used",
    buyNowPrice: 25000000,
    images: [
        "https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&q=80&w=800",
         "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "Fujifilm X100VI Digital Camera",
    slug: "fujifilm-x100vi-camera",
    description: "The latest iteration of the iconic X100 series. 40MP sensor, IBIS, and 6.2K video. Silver finish. Comes with original box, leather case, and extra battery. Barely used.",
    startingPrice: 38000000,
    categoryName: "Điện tử",
    condition: "used",
    buyNowPrice: 45000000,
    images: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=800",
         "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "Herman Miller Aeron Chair - Remastered",
    slug: "herman-miller-aeron-remastered",
    description: "Size B. Graphite color. The gold standard for ergonomic office chairs. Features PostureFit SL, fully adjustable arms, and Pellicle mesh. Excellent condition.",
    startingPrice: 15000000,
    categoryName: "Nội thất",
    condition: "used",
    buyNowPrice: 25000000,
    images: [
        "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1618220252344-8ec99ec624b1?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "Rare Pokémon Card Collection (1st Edition)",
    slug: "pokemon-card-collection-1st-edition",
    description: "A curated collection of 1st Edition Base Set cards. Includes PSA 8 Charizard, PSA 9 Blastoise, and various holos. A serious investment for collectors.",
    startingPrice: 50000000,
    categoryName: "Sưu tầm",
    condition: "used",
    buyNowPrice: 120000000,
    images: [
        "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1623939012339-5b3ea89cf0c7?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1606103836293-c811d72614a0?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "Dyson V15 Detect Absolute Vacuum",
    slug: "dyson-v15-detect-absolute",
    description: "Powerful cordless vacuum with laser illumination. Reveals microscopic dust. Auto-adjusts suction power. Comes with all original attachments and mounting dock.",
    startingPrice: 10000000,
    categoryName: "Gia dụng",
    condition: "new",
    buyNowPrice: 18000000,
    images: [
        "https://images.unsplash.com/photo-1558317374-a74b2f434c86?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1585513237731-294b63878b27?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    title: "Nike SB Dunk Low 'Chicago'",
    slug: "nike-sb-dunk-low-chicago",
    description: "Size US 10. Authentic. Iconic colorway inspired by the AJ1 Chicago. Padded tongue for comfort. Brand new in box with extra laces.",
    startingPrice: 8000000,
    categoryName: "Thời trang",
    condition: "new",
    buyNowPrice: 14000000,
    images: [
         "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800",
         "https://images.unsplash.com/photo-1607522370275-f14bc3d5b248?auto=format&fit=crop&q=80&w=800",
         "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
    ]
  },
    // Adding the specific "Sony Electronic Set" that might be referenced in the Hero section logic to ensure it exists
    {
        title: "Sony Ultimate Electronics Set",
        slug: "sony-ultimate-electronics-set",
        description: "Complete setup including Sony Headphones, Wireless Keyboard, and premium accessories. Perfect for the modern workspace.",
        startingPrice: 8000000,
        categoryName: "Điện tử",
        condition: "new",
        buyNowPrice: 12500000,
        images: [
            "https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800"
        ]
    }
];

const seedAuctions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ role: 'seller' }); 
    console.log(`Found ${users.length} sellers.`);
    
    // Helper to find category ID
    const getCategory = async (name) => {
        let cat = await Category.findOne({ name: name });
        if (!cat) {
             // Fallback to finding by english name or creating/getting one of existing
             cat = await Category.findOne({ $or: [{ name: { $regex: name, $options: 'i' } }, { slug: { $regex: name.toLowerCase(), $options: 'i'} }] });
        }
        if (!cat) {
            // Last resort: get first category
            cat = await Category.findOne();
        }
        return cat._id;
    };

    // If no sellers, try to find ANY user and use them (or make them seller)
    let potentialSellers = users;
    if (potentialSellers.length === 0) {
        console.log("Fetching arbitrary users to act as sellers...");
        potentialSellers = await User.find({});
    }

    if (potentialSellers.length === 0) {
        console.log("No users found at all! Please register a user first.");
        process.exit(1);
    }

    console.log(`Found ${potentialSellers.length} potential sellers.`);

    for (const productInfo of productsData) {
      // Pick a random seller
      const seller = potentialSellers[Math.floor(Math.random() * potentialSellers.length)];

      const categoryId = await getCategory(productInfo.categoryName);

      // Create Product
      const product = await Product.create({
        sellerId: seller._id,
        categoryId: categoryId,
        title: productInfo.title,
        slug: productInfo.slug + '-' + Date.now() + Math.floor(Math.random() * 1000),
        description: productInfo.description,
        primaryImageUrl: productInfo.images[0], 
        imageUrls: productInfo.images,
        metadata: {
            brand: "Generic",
            model: "Standard",
            condition: productInfo.condition
        },
        isActive: true,
        isArchived: false
      });
      console.log(`Created product: ${product.title}`);

      // Create Auction
      const startTime = new Date(); // Start now
      const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000); // Ends in 7 days
      const priceStep = 50000;

      const auction = await Auction.create({
        productId: product._id,
        sellerId: seller._id,
        startPrice: productInfo.startingPrice,
        currentPrice: productInfo.startingPrice,
        priceStep: priceStep,
        startAt: startTime,
        endAt: endTime,
        status: "active",
        buyNowPrice: productInfo.buyNowPrice,
        bidCount: 0,
        autoExtendEnabled: true,
        // Make one specific auction look "hot" if needed
        bidCount: Math.floor(Math.random() * 5),
        currentPrice: productInfo.startingPrice + (Math.floor(Math.random() * 5) * priceStep)
      });

      console.log(`Created auction for ${product.title}`);
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding auctions:', error);
    if (error.name === 'ValidationError') {
        for (let field in error.errors) {
            console.error(`Field ${field}: ${error.errors[field].message}`);
        }
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAuctions();
