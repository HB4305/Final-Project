import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Auction from './models/Auction.js';
import Bid from './models/Bid.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] Connected to MongoDB');

    // 1. Xóa dữ liệu cũ
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('[SEED] Cleaned up old data');

    // 2. Tạo người dùng
    const seller = await User.create({
      username: 'seller_test_001',
      email: 'seller@test.com',
      emailVerified: true,
      passwordHash: '$2b$10$hashedpassword', // bcrypt hash of 'password123'
      fullName: 'Người Bán Test',
      contactPhone: '+84912345678',
      roles: ['seller'],
      ratingSummary: {
        countPositive: 150,
        countNegative: 5,
        totalCount: 155,
        score: 0.97
      },
      status: 'active'
    });
    console.log('[SEED] Created seller:', seller._id);

    const bidder1 = await User.create({
      username: 'bidder_test_001',
      email: 'bidder1@test.com',
      emailVerified: true,
      passwordHash: '$2b$10$hashedpassword',
      fullName: 'Người Mua Test 1',
      roles: ['bidder'],
      ratingSummary: {
        countPositive: 45,
        countNegative: 2,
        totalCount: 47,
        score: 0.96
      },
      status: 'active'
    });

    const bidder2 = await User.create({
      username: 'bidder_test_002',
      email: 'bidder2@test.com',
      emailVerified: true,
      passwordHash: '$2b$10$hashedpassword',
      fullName: 'Người Mua Test 2',
      roles: ['bidder'],
      ratingSummary: {
        countPositive: 80,
        countNegative: 3,
        totalCount: 83,
        score: 0.96
      },
      status: 'active'
    });

    console.log('[SEED] Created bidders:', bidder1._id, bidder2._id);

    // 3. Tạo danh mục (5 parent + 10 child)
    const parentCategories = await Category.insertMany([
      { name: 'Điện tử', slug: 'dien-tu', parentId: null, path: [], level: 1 },
      { name: 'Thời trang', slug: 'thoi-trang', parentId: null, path: [], level: 1 },
      { name: 'Nhà cửa', slug: 'nha-cua', parentId: null, path: [], level: 1 },
      { name: 'Thể thao', slug: 'the-thao', parentId: null, path: [], level: 1 },
      { name: 'Sách & Học tập', slug: 'sach-hoc-tap', parentId: null, path: [], level: 1 }
    ]);
    console.log('[SEED] Created 5 parent categories');

    const childCategories = await Category.insertMany([
      // Điện tử
      { name: 'Điện thoại', slug: 'dien-thoai', parentId: parentCategories[0]._id, path: [parentCategories[0]._id], level: 2 },
      { name: 'Laptop', slug: 'laptop', parentId: parentCategories[0]._id, path: [parentCategories[0]._id], level: 2 },
      // Thời trang
      { name: 'Áo', slug: 'ao', parentId: parentCategories[1]._id, path: [parentCategories[1]._id], level: 2 },
      { name: 'Giày', slug: 'giay', parentId: parentCategories[1]._id, path: [parentCategories[1]._id], level: 2 },
      // Nhà cửa
      { name: 'Nội thất', slug: 'noi-that', parentId: parentCategories[2]._id, path: [parentCategories[2]._id], level: 2 },
      { name: 'Điều hòa', slug: 'dieu-hoa', parentId: parentCategories[2]._id, path: [parentCategories[2]._id], level: 2 },
      // Thể thao
      { name: 'Bóng đá', slug: 'bong-da', parentId: parentCategories[3]._id, path: [parentCategories[3]._id], level: 2 },
      { name: 'Cầu lông', slug: 'cau-long', parentId: parentCategories[3]._id, path: [parentCategories[3]._id], level: 2 },
      // Sách
      { name: 'Sách tiếng Việt', slug: 'sach-tieng-viet', parentId: parentCategories[4]._id, path: [parentCategories[4]._id], level: 2 },
      { name: 'Sách nước ngoài', slug: 'sach-nuoc-ngoai', parentId: parentCategories[4]._id, path: [parentCategories[4]._id], level: 2 }
    ]);
    console.log('[SEED] Created 10 child categories');

    // 4. Tạo 20 sản phẩm
    let products;
    try {
      products = await Product.insertMany([
        // Điện thoại (6 sản phẩm)
        {
          sellerId: seller._id,
          categoryId: childCategories[0]._id,
          title: 'iPhone 15 Pro Max',
          slug: 'iphone-15-pro-max',
          descriptionHistory: [
            {
              text: 'iPhone 15 Pro Max 256GB Space Black, hàng chính hãng Apple, chưa kích hoạt, bao gồm đầy đủ phụ kiện.',
              createdAt: new Date(),
              authorId: seller._id
            }
          ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=iPhone+15+Pro+Max',
        imageUrls: [
          'https://via.placeholder.com/300?text=iPhone+15+Pro+Max+1',
          'https://via.placeholder.com/300?text=iPhone+15+Pro+Max+2',
          'https://via.placeholder.com/300?text=iPhone+15+Pro+Max+3'
        ],
        isActive: true,
        baseCurrency: 'VND',
        metadata: {
          brand: 'Apple',
          model: 'iPhone 15 Pro Max',
          condition: 'Mới 100%',
          specs: { storage: '256GB', color: 'Space Black', processor: 'A17 Pro' }
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[0]._id,
        title: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        descriptionHistory: [
          { text: 'Samsung Galaxy S24 Ultra 512GB Titanium Black, mở hộp 1 lần, có bảo hành 2 năm', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Samsung+Galaxy+S24',
        imageUrls: ['https://via.placeholder.com/300?text=Samsung+1', 'https://via.placeholder.com/300?text=Samsung+2', 'https://via.placeholder.com/300?text=Samsung+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: {
          brand: 'Samsung',
          model: 'Galaxy S24 Ultra',
          condition: 'Như mới',
          specs: { storage: '512GB', color: 'Titanium Black' }
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[0]._id,
        title: 'iPhone 14 Pro',
        slug: 'iphone-14-pro',
        descriptionHistory: [
          { text: 'iPhone 14 Pro 128GB Gold, hàng chính hãng, đã sử dụng 3 tháng', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=iPhone+14+Pro',
        imageUrls: ['https://via.placeholder.com/300?text=iPhone+14+1', 'https://via.placeholder.com/300?text=iPhone+14+2', 'https://via.placeholder.com/300?text=iPhone+14+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Apple', model: 'iPhone 14 Pro', condition: 'Đã dùng', specs: { storage: '128GB', color: 'Gold' } },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[0]._id,
        title: 'Google Pixel 8 Pro',
        slug: 'google-pixel-8-pro',
        descriptionHistory: [
          { text: 'Google Pixel 8 Pro 256GB Obsidian, mới 100%', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Pixel+8+Pro',
        imageUrls: ['https://via.placeholder.com/300?text=Pixel+1', 'https://via.placeholder.com/300?text=Pixel+2', 'https://via.placeholder.com/300?text=Pixel+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Google', model: 'Pixel 8 Pro', condition: 'Mới', specs: { storage: '256GB', color: 'Obsidian' } },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[0]._id,
        title: 'OnePlus 12',
        slug: 'oneplus-12',
        descriptionHistory: [
          { text: 'OnePlus 12 256GB Silky Black, hàng chính hãng', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=OnePlus+12',
        imageUrls: ['https://via.placeholder.com/300?text=OnePlus+1', 'https://via.placeholder.com/300?text=OnePlus+2', 'https://via.placeholder.com/300?text=OnePlus+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'OnePlus', model: '12', condition: 'Mới', specs: { storage: '256GB' } },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[0]._id,
        title: 'Xiaomi 14 Ultra',
        slug: 'xiaomi-14-ultra',
        descriptionHistory: [
          { text: 'Xiaomi 14 Ultra 512GB Space Black, mới 100%', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Xiaomi+14+Ultra',
        imageUrls: ['https://via.placeholder.com/300?text=Xiaomi+1', 'https://via.placeholder.com/300?text=Xiaomi+2', 'https://via.placeholder.com/300?text=Xiaomi+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Xiaomi', model: '14 Ultra', condition: 'Mới', specs: { storage: '512GB' } },
        createdAt: new Date()
      },

      // Laptop (4 sản phẩm)
      {
        sellerId: seller._id,
        categoryId: childCategories[1]._id,
        title: 'MacBook Pro 16 M3 Max',
        slug: 'macbook-pro-16-m3-max',
        descriptionHistory: [
          { text: 'MacBook Pro 16" M3 Max 48GB 1TB, hàng chính hãng Apple', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=MacBook+Pro+16',
        imageUrls: ['https://via.placeholder.com/300?text=MacBook+1', 'https://via.placeholder.com/300?text=MacBook+2', 'https://via.placeholder.com/300?text=MacBook+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Apple', model: 'MacBook Pro 16', condition: 'Mới', specs: { cpu: 'M3 Max', ram: '48GB', storage: '1TB' } },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[1]._id,
        title: 'Dell XPS 15',
        slug: 'dell-xps-15',
        descriptionHistory: [
          { text: 'Dell XPS 15 i7 RTX 4060, 32GB RAM, 1TB SSD', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Dell+XPS+15',
        imageUrls: ['https://via.placeholder.com/300?text=Dell+1', 'https://via.placeholder.com/300?text=Dell+2', 'https://via.placeholder.com/300?text=Dell+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Dell', model: 'XPS 15', condition: 'Như mới', specs: { cpu: 'i7-13700H', ram: '32GB', storage: '1TB' } },
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[1]._id,
        title: 'HP Pavilion 15',
        slug: 'hp-pavilion-15',
        descriptionHistory: [
          { text: 'HP Pavilion 15 i5 MX550, 16GB RAM, 512GB SSD', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=HP+Pavilion',
        imageUrls: ['https://via.placeholder.com/300?text=HP+1', 'https://via.placeholder.com/300?text=HP+2', 'https://via.placeholder.com/300?text=HP+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'HP', model: 'Pavilion 15', condition: 'Đã dùng', specs: { cpu: 'i5-12450H', ram: '16GB', storage: '512GB' } },
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[1]._id,
        title: 'Lenovo ThinkPad X1 Carbon',
        slug: 'lenovo-thinkpad-x1-carbon',
        descriptionHistory: [
          { text: 'Lenovo ThinkPad X1 Carbon i7, 16GB, 512GB', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Lenovo+X1',
        imageUrls: ['https://via.placeholder.com/300?text=Lenovo+1', 'https://via.placeholder.com/300?text=Lenovo+2', 'https://via.placeholder.com/300?text=Lenovo+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Lenovo', model: 'ThinkPad X1', condition: 'Mới', specs: { cpu: 'i7-1365U', ram: '16GB', storage: '512GB' } },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },

      // Thời trang & Khác (10 sản phẩm khác)
      {
        sellerId: seller._id,
        categoryId: childCategories[2]._id,
        title: 'Áo Thun Nike Dri-FIT',
        slug: 'ao-thun-nike-dri-fit',
        descriptionHistory: [
          { text: 'Áo thun Nike Dri-FIT chính hãng, size L, màu đen', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Nike+Shirt',
        imageUrls: ['https://via.placeholder.com/300?text=Nike+1', 'https://via.placeholder.com/300?text=Nike+2', 'https://via.placeholder.com/300?text=Nike+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Nike', condition: 'Mới', specs: { size: 'L', material: '100% Cotton' } },
        createdAt: new Date()
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[3]._id,
        title: 'Giày Air Jordan 1 Retro',
        slug: 'giay-air-jordan-1',
        descriptionHistory: [
          { text: 'Giày Air Jordan 1 Retro High OG Chicago, size 9.5US', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Air+Jordan+1',
        imageUrls: ['https://via.placeholder.com/300?text=Jordan+1', 'https://via.placeholder.com/300?text=Jordan+2', 'https://via.placeholder.com/300?text=Jordan+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Jordan', condition: 'Như mới', specs: { size: '9.5US' } },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[4]._id,
        title: 'Bàn Làm Việc Gỗ Sồi',
        slug: 'ban-lam-viec-go-soi',
        descriptionHistory: [
          { text: 'Bàn làm việc gỗ sồi nguyên khối, kích thước 120x60cm', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Desk',
        imageUrls: ['https://via.placeholder.com/300?text=Desk+1', 'https://via.placeholder.com/300?text=Desk+2', 'https://via.placeholder.com/300?text=Desk+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'HandMade', condition: 'Mới', specs: { material: 'Gỗ sồi', size: '120x60cm' } },
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[5]._id,
        title: 'Điều Hòa LG Inverter 1.5HP',
        slug: 'dieu-hoa-lg-1-5hp',
        descriptionHistory: [
          { text: 'Điều hòa LG Inverter 1.5HP, tiết kiệm điện, bảo hành 3 năm', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=AC+LG',
        imageUrls: ['https://via.placeholder.com/300?text=AC+1', 'https://via.placeholder.com/300?text=AC+2', 'https://via.placeholder.com/300?text=AC+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'LG', condition: 'Mới', specs: { power: '1.5HP', type: 'Inverter' } },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[6]._id,
        title: 'Quả Bóng FIFA Pro',
        slug: 'qua-bong-fifa-pro',
        descriptionHistory: [
          { text: 'Quả bóng đá FIFA Pro, chất lượng chuyên nghiệp', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Football',
        imageUrls: ['https://via.placeholder.com/300?text=Ball+1', 'https://via.placeholder.com/300?text=Ball+2', 'https://via.placeholder.com/300?text=Ball+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'FIFA', condition: 'Mới', specs: { material: 'PVC' } },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[7]._id,
        title: 'Vợt Cầu Lông Yonex Nanoray',
        slug: 'vot-cau-long-yonex',
        descriptionHistory: [
          { text: 'Vợt cầu lông Yonex Nanoray, dành cho chuyên nghiệp', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Badminton',
        imageUrls: ['https://via.placeholder.com/300?text=Racket+1', 'https://via.placeholder.com/300?text=Racket+2', 'https://via.placeholder.com/300?text=Racket+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Yonex', condition: 'Như mới', specs: { series: 'Nanoray' } },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[8]._id,
        title: 'Nhà Giả Kim - Paulo Coelho',
        slug: 'nha-gia-kim',
        descriptionHistory: [
          { text: 'Sách Nhà Giả Kim của Paulo Coelho, bìa cứng, tái bản lần 10', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=Book',
        imageUrls: ['https://via.placeholder.com/300?text=Book+1', 'https://via.placeholder.com/300?text=Book+2', 'https://via.placeholder.com/300?text=Book+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'Skybooks', condition: 'Như mới', specs: { author: 'Paulo Coelho', pages: 320 } },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        sellerId: seller._id,
        categoryId: childCategories[9]._id,
        title: 'The Alchemist - English Version',
        slug: 'the-alchemist-english',
        descriptionHistory: [
          { text: 'Sách The Alchemist bản tiếng Anh, bìa mềm', createdAt: new Date(), authorId: seller._id }
        ],
        primaryImageUrl: 'https://via.placeholder.com/300?text=English+Book',
        imageUrls: ['https://via.placeholder.com/300?text=Eng+1', 'https://via.placeholder.com/300?text=Eng+2', 'https://via.placeholder.com/300?text=Eng+3'],
        isActive: true,
        baseCurrency: 'VND',
        metadata: { brand: 'HarperCollins', condition: 'Mới', specs: { author: 'Paulo Coelho', pages: 224 } },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
      ], { ordered: false }); // FIX: ordered: false để insert dù có lỗi
      console.log(`[SEED] Created ${products.length} products`);
    } catch (error) {
      console.error('[SEED] ❌ Lỗi khi tạo products:', error.message);
      if (error.errors) {
        console.error('[SEED] Validation errors:', Object.keys(error.errors));
      }
      throw error;
    }

    // Kiểm tra số lượng products
    if (!products || products.length === 0) {
      throw new Error(`Lỗi: Không tạo được product nào!`);
    }
    console.log(`[SEED] Tạo ${products.length}/20 products thành công (${20 - products.length} lỗi)`);

    // 5. Tạo phiên đấu giá cho tất cả sản phẩm
    const now = new Date();
    const auctionConfigs = [
      // Điện thoại - 6 phiên
      { productIndex: 0, startPrice: 20000000, currentPrice: 25000000, bidCount: 12, endHours: 10 },
      { productIndex: 1, startPrice: 18000000, currentPrice: 22500000, bidCount: 20, endHours: 30 },
      { productIndex: 2, startPrice: 12000000, currentPrice: 15500000, bidCount: 8, endHours: 48 },
      { productIndex: 3, startPrice: 16000000, currentPrice: 19200000, bidCount: 15, endHours: 5 },
      { productIndex: 4, startPrice: 14000000, currentPrice: 18300000, bidCount: 25, endHours: 72 },
      { productIndex: 5, startPrice: 15000000, currentPrice: 17800000, bidCount: 10, endHours: 20 },
      // Laptop - 4 phiên
      { productIndex: 6, startPrice: 30000000, currentPrice: 38500000, bidCount: 18, endHours: 3 },
      { productIndex: 7, startPrice: 25000000, currentPrice: 31200000, bidCount: 14, endHours: 40 },
      { productIndex: 8, startPrice: 18000000, currentPrice: 22800000, bidCount: 11, endHours: 60 },
      { productIndex: 9, startPrice: 15000000, currentPrice: 19500000, bidCount: 9, endHours: 35 },
      // Thời trang - 2 phiên
      { productIndex: 10, startPrice: 500000, currentPrice: 750000, bidCount: 5, endHours: 24 },
      { productIndex: 11, startPrice: 2000000, currentPrice: 3500000, bidCount: 8, endHours: 48 },
      // Nhà cửa - 2 phiên
      { productIndex: 12, startPrice: 5000000, currentPrice: 7200000, bidCount: 6, endHours: 36 },
      { productIndex: 13, startPrice: 8000000, currentPrice: 11500000, bidCount: 10, endHours: 28 },
      // Thể thao - 2 phiên
      { productIndex: 14, startPrice: 300000, currentPrice: 550000, bidCount: 4, endHours: 72 },
      { productIndex: 15, startPrice: 1500000, currentPrice: 2800000, bidCount: 7, endHours: 54 },
      // Sách - 2 phiên
      { productIndex: 16, startPrice: 150000, currentPrice: 280000, bidCount: 3, endHours: 60 },
      { productIndex: 17, startPrice: 200000, currentPrice: 400000, bidCount: 5, endHours: 42 }
    ];

    const auctions = [];
    for (const config of auctionConfigs) {
      if (config.productIndex >= products.length) break;
      
      auctions.push({
        productId: products[config.productIndex]._id,
        sellerId: seller._id,
        startPrice: config.startPrice,
        currentPrice: config.currentPrice,
        bidCount: config.bidCount,
        buyNowPrice: config.currentPrice + Math.ceil(config.currentPrice * 0.05), // 5% markup
        priceStep: Math.floor(config.startPrice / 100),
        startAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(now.getTime() + config.endHours * 60 * 60 * 1000),
        status: 'active',
        autoExtendEnabled: true,
        autoExtendWindowSec: 300,
        autoExtendAmountSec: 600
      });
    }

    const createdAuctions = await Auction.insertMany(auctions, { ordered: false });
    console.log(`[SEED] Created ${createdAuctions.length} auctions`);

    // 6. FIX: Tạo bids dựa trên auctions thực tế từ DB
    const bids = [];
    for (let i = 0; i < createdAuctions.length; i++) {
      const auctionBidCount = createdAuctions[i].bidCount;
      
      for (let j = 0; j < auctionBidCount; j++) {
        const isBidder1 = j % 2 === 0;
        const bidder = isBidder1 ? bidder1 : bidder2;
        
        bids.push({
          auctionId: createdAuctions[i]._id,
          productId: createdAuctions[i].productId,
          bidderId: bidder._id,
          amount: createdAuctions[i].startPrice + (createdAuctions[i].priceStep * (j + 1)),
          createdAt: new Date(now.getTime() - (auctionBidCount - j) * 60 * 1000),
          isAuto: j > auctionBidCount / 2 // nửa sau là auto-bid
        });
      }
    }
    
    await Bid.insertMany(bids, { ordered: false });
    console.log(`[SEED] Created ${bids.length} bids`);

    console.log('[SEED] Seed data completed successfully!');
    console.log(`\n📊 Summary:
    - Users: 1 seller + 2 bidders
    - Categories: 5 parent + 10 child
    - Products: ${products.length}
    - Auctions: ${createdAuctions.length}
    - Bids: ${bids.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error('[SEED] ❌ Error:', error);
    process.exit(1);
  }
}

seedData();