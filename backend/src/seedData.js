import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Auction from './models/Auction.js';
import Bid from './models/Bid.js';
import User from './models/User.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] Connected to MongoDB');

    const now = new Date();
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Dọn dẹp Database
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('[SEED] Cleaned up old data');

    // 2. Tạo User (1 Seller, 2 Bidders)
    const seller = await User.create({
      username: 'seller_test_001', email: 'seller@test.com', emailVerified: true,
      passwordHash: hashedPassword, fullName: 'Người Bán Test', roles: ['seller'], status: 'active',
      ratingSummary: { countPositive: 150, countNegative: 5, totalCount: 155, score: 0.97 }
    });
    const bidder1 = await User.create({
      username: 'bidder_test_001', email: 'bidder1@test.com', emailVerified: true,
      passwordHash: hashedPassword, fullName: 'Người Mua Test 1', roles: ['bidder'], status: 'active'
    });
    const bidder2 = await User.create({
      username: 'bidder_test_002', email: 'bidder2@test.com', emailVerified: true,
      passwordHash: hashedPassword, fullName: 'Người Mua Test 2', roles: ['bidder'], status: 'active'
    });

    // 3. Tạo Danh mục
    const parentCats = await Category.insertMany([
      { name: 'Điện tử', slug: 'dien-tu', parentId: null, path: [], level: 1 },
      { name: 'Thời trang', slug: 'thoi-trang', parentId: null, path: [], level: 1 },
      { name: 'Nhà cửa', slug: 'nha-cua', parentId: null, path: [], level: 1 },
      { name: 'Thể thao', slug: 'the-thao', parentId: null, path: [], level: 1 },
      { name: 'Sách & Học tập', slug: 'sach-hoc-tap', parentId: null, path: [], level: 1 }
    ]);

    const childCats = await Category.insertMany([
      { name: 'Điện thoại', slug: 'dien-thoai', parentId: parentCats[0]._id, path: [parentCats[0]._id], level: 2 },
      { name: 'Laptop', slug: 'laptop', parentId: parentCats[0]._id, path: [parentCats[0]._id], level: 2 },
      { name: 'Áo', slug: 'ao', parentId: parentCats[1]._id, path: [parentCats[1]._id], level: 2 },
      { name: 'Giày', slug: 'giay', parentId: parentCats[1]._id, path: [parentCats[1]._id], level: 2 },
      { name: 'Nội thất', slug: 'noi-that', parentId: parentCats[2]._id, path: [parentCats[2]._id], level: 2 },
      { name: 'Điều hòa', slug: 'dieu-hoa', parentId: parentCats[2]._id, path: [parentCats[2]._id], level: 2 },
      { name: 'Bóng đá', slug: 'bong-da', parentId: parentCats[3]._id, path: [parentCats[3]._id], level: 2 },
      { name: 'Cầu lông', slug: 'cau-long', parentId: parentCats[3]._id, path: [parentCats[3]._id], level: 2 },
      { name: 'Sách tiếng Việt', slug: 'sach-tieng-viet', parentId: parentCats[4]._id, path: [parentCats[4]._id], level: 2 },
      { name: 'Sách nước ngoài', slug: 'sach-nuoc-ngoai', parentId: parentCats[4]._id, path: [parentCats[4]._id], level: 2 }
    ]);

    // 4. Danh sách 18 sản phẩm chi tiết
    const productsData = [
      // ĐIỆN THOẠI
      {
        title: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max', catIdx: 0,
        img: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500',
        imgs: ['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500']
      },
      {
        title: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', catIdx: 0,
        img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
        imgs: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500']
      },
      {
        title: 'iPhone 14 Pro', slug: 'iphone-14-pro', catIdx: 0,
        img: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=500',
        imgs: ['https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=500', 'https://images.unsplash.com/photo-1632661674386-33e7e8601d5e?w=500', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500']
      },
      {
        title: 'Google Pixel 8 Pro', slug: 'google-pixel-8-pro', catIdx: 0,
        img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500',
        imgs: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500', 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500', 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500']
      },
      {
        title: 'OnePlus 12', slug: 'oneplus-12', catIdx: 0,
        img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        imgs: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?w=500', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500']
      },
      {
        title: 'Xiaomi 14 Ultra', slug: 'xiaomi-14-ultra', catIdx: 0,
        img: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=500',
        imgs: ['https://images.unsplash.com/photo-1567581935884-3349723552ca?w=500', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500', 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500']
      },

      // LAPTOP
      {
        title: 'MacBook Pro 16 M3 Max', slug: 'macbook-pro-16-m3-max', catIdx: 1,
        img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        imgs: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500']
      },
      {
        title: 'Dell XPS 15', slug: 'dell-xps-15', catIdx: 1,
        img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500',
        imgs: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500']
      },
      {
        title: 'HP Pavilion 15', slug: 'hp-pavilion-15', catIdx: 1,
        img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        imgs: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500']
      },
      {
        title: 'Lenovo ThinkPad X1 Carbon', slug: 'lenovo-thinkpad-x1-carbon', catIdx: 1,
        img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',
        imgs: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500', 'https://images.unsplash.com/photo-1602080858428-57174f9431cf?w=500']
      },

      // THỜI TRANG & KHÁC
      {
        title: 'Áo Thun Nike Dri-FIT', slug: 'ao-thun-nike-dri-fit', catIdx: 2,
        img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        imgs: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500']
      },
      {
        title: 'Giày Air Jordan 1 Retro', slug: 'giay-air-jordan-1', catIdx: 3,
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        imgs: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500']
      },
      {
        title: 'Bàn Làm Việc Gỗ Sồi', slug: 'ban-lam-viec-go-soi', catIdx: 4,
        img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500',
        imgs: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500']
      },
      {
        title: 'Điều Hòa LG Inverter 1.5HP', slug: 'dieu-hoa-lg-1-5hp', catIdx: 5,
        img: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=500',
        imgs: ['https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=500', 'https://images.unsplash.com/photo-1545259742-12f0cb57b28d?w=500', 'https://images.unsplash.com/photo-1635840420193-0fc6c3e67e90?w=500']
      },
      {
        title: 'Quả Bóng FIFA Pro', slug: 'qua-bong-fifa-pro', catIdx: 6,
        img: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=500',
        imgs: ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=500', 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aad?w=500', 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=500']
      },
      {
        title: 'Vợt Cầu Lông Yonex Nanoray', slug: 'vot-cau-long-yonex', catIdx: 7,
        img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
        imgs: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500', 'https://images.unsplash.com/photo-1593786481241-86f4f98c5840?w=500', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=500']
      },
      {
        title: 'Nhà Giả Kim - Paulo Coelho', slug: 'nha-gia-kim', catIdx: 8,
        img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        imgs: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500']
      },
      {
        title: 'The Alchemist - English Version', slug: 'the-alchemist-english', catIdx: 9,
        img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500',
        imgs: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500']
      }
    ];

    const products = await Product.insertMany(productsData.map((p, idx) => ({
      sellerId: seller._id,
      categoryId: childCats[p.catIdx]._id,
      title: p.title,
      slug: `${p.slug}-${Date.now()}-${idx}`,
      descriptionHistory: [{ text: `Sản phẩm ${p.title} chất lượng cao, đầy đủ phụ kiện.`, createdAt: now, authorId: seller._id }],
      primaryImageUrl: p.img,
      imageUrls: p.imgs,
      isActive: true,
      baseCurrency: 'VND',
      createdAt: new Date(now.getTime() - (idx * 3600000))
    })));
    console.log(`[SEED] Created ${products.length} products`);

    // 5. Cấu hình Phiên đấu giá
    const auctionConfigs = [
      { startPrice: 20000000, currentPrice: 25000000, bidCount: 12, endHours: 10 },
      { startPrice: 18000000, currentPrice: 22500000, bidCount: 20, endHours: 30 },
      { startPrice: 12000000, currentPrice: 15500000, bidCount: 8, endHours: 48 },
      { startPrice: 16000000, currentPrice: 19200000, bidCount: 15, endHours: 5 },
      { startPrice: 14000000, currentPrice: 18300000, bidCount: 25, endHours: 72 },
      { startPrice: 15000000, currentPrice: 17800000, bidCount: 10, endHours: 20 },
      { startPrice: 30000000, currentPrice: 38500000, bidCount: 18, endHours: 3 },
      { startPrice: 25000000, currentPrice: 31200000, bidCount: 14, endHours: 40 },
      { startPrice: 18000000, currentPrice: 22800000, bidCount: 11, endHours: 60 },
      { startPrice: 15000000, currentPrice: 19500000, bidCount: 9, endHours: 35 },
      { startPrice: 500000, currentPrice: 750000, bidCount: 5, endHours: 24 },
      { startPrice: 2000000, currentPrice: 3500000, bidCount: 8, endHours: 48 },
      { startPrice: 5000000, currentPrice: 7200000, bidCount: 6, endHours: 36 },
      { startPrice: 8000000, currentPrice: 11500000, bidCount: 10, endHours: 28 },
      { startPrice: 300000, currentPrice: 550000, bidCount: 4, endHours: 72 },
      { startPrice: 1500000, currentPrice: 2800000, bidCount: 7, endHours: 54 },
      { startPrice: 150000, currentPrice: 280000, bidCount: 3, endHours: 60 },
      { startPrice: 200000, currentPrice: 400000, bidCount: 5, endHours: 42 }
    ];

    const auctions = products.map((prod, i) => {
      const config = auctionConfigs[i] || { startPrice: 1000000, currentPrice: 1200000, bidCount: 5, endHours: 24 };
      return {
        productId: prod._id,
        sellerId: seller._id,
        startPrice: config.startPrice,
        currentPrice: config.currentPrice,
        bidCount: config.bidCount,
        buyNowPrice: Math.ceil(config.currentPrice * 1.15),
        priceStep: Math.floor(config.startPrice / 100),
        startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Bắt đầu từ hôm qua
        endAt: new Date(now.getTime() + config.endHours * 60 * 60 * 1000), // Kết thúc trong tương lai
        status: 'active',
        autoExtendEnabled: true
      };
    });

    const createdAuctions = await Auction.insertMany(auctions);
    console.log(`[SEED] Created ${createdAuctions.length} auctions`);

    // 6. Tạo Bids
    const bids = [];
    createdAuctions.forEach(auc => {
      for (let j = 0; j < auc.bidCount; j++) {
        bids.push({
          auctionId: auc._id,
          productId: auc.productId,
          bidderId: j % 2 === 0 ? bidder1._id : bidder2._id,
          amount: auc.startPrice + (auc.priceStep * (j + 1)),
          createdAt: new Date(auc.startAt.getTime() + (j + 1) * 15 * 60 * 1000), // Mỗi bid cách nhau 15p
          isAuto: j > auc.bidCount / 2
        });
      }
    });

    await Bid.insertMany(bids);
    console.log(`[SEED] Created ${bids.length} bids`);

    console.log('\n✅ [SUCCESS] Seed hoàn tất! Mọi sản phẩm đã sẵn sàng để test.');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] ❌ Lỗi:', error);
    process.exit(1);
  }
}

seedData();