
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Auction from '../models/Auction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
  'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500',
  'https://images.unsplash.com/photo-1593642632823-8f78536788b6?w=500',
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500',
  'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' // Repeat some if needed
];

function getRandomImages(count) {
  const shuffled = SAMPLE_IMAGES.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const PRODUCTS_DATA = [
  {
    title: 'iPhone 15 Pro Max Titanium',
    slug: 'iphone-15-pro-max-titanium',
    description: `
      <h2>iPhone 15 Pro Max - Đỉnh cao công nghệ</h2>
      <p>Sản phẩm flagship mới nhất từ Apple với khung viền Titanium siêu bền, chip A17 Pro mạnh mẽ.</p>
      <ul>
        <li>Dung lượng: 256GB</li>
        <li>Màu sắc: Titan tự nhiên</li>
        <li>Tình trạng: Mới 100% nguyên seal</li>
        <li>Bảo hành: 12 tháng chính hãng VN/A</li>
      </ul>
      <p>Đây là cơ hội tuyệt vời để sở hữu siêu phẩm này với giá khởi điểm cực tốt.</p>
    `,
    startPrice: 20000000
  },
  {
    title: 'MacBook Pro 14 M3 Max',
    slug: 'macbook-pro-14-m3-max',
    description: `
      <h2>MacBook Pro 14 inch M3 Max</h2>
      <p>Chiếc laptop mạnh mẽ nhất dành cho pro users. Xử lý đồ họa, video 8K mượt mà.</p>
      <ul>
        <li>RAM: 36GB</li>
        <li>SSD: 1TB</li>
        <li>Chip: M3 Max 14-core CPU, 30-core GPU</li>
        <li>Màn hình: Liquid Retina XDR 120Hz</li>
      </ul>
      <p>Máy demo trưng bày, ngoại hình 99.9%, sạc 5 lần.</p>
    `,
    startPrice: 40000000
  },
  {
    title: 'Sony Alpha A7 IV Body',
    slug: 'sony-alpha-a7-iv-body',
    description: `
      <h2>Sony A7 IV - Chuẩn mực mới cho Hybrid Camera</h2>
      <p>Cảm biến Exmor R CMOS 33MP, quay phim 4K 60p 10-bit 4:2:2.</p>
      <ul>
        <li>Lấy nét tự động theo mắt Real-time Eye AF</li>
        <li>Chống rung 5 trục trong thân máy</li>
        <li>Màn hình xoay lật cảm ứng</li>
        <li>Tặng kèm thẻ nhớ 64GB và túi đựng</li>
      </ul>
      <p>Hàng xách tay Nhật, fullbox, menu tiếng Anh.</p>
    `,
    startPrice: 35000000
  },
  {
    title: 'Đồng hồ Omega Seamaster Aqua Terra',
    slug: 'omega-seamaster-aqua-terra',
    description: `
      <h2>Omega Seamaster Aqua Terra 150M</h2>
      <p>Biểu tượng của sự sang trọng và chính xác. Mặt số xanh deep blue tuyệt đẹp.</p>
      <ul>
        <li>Size: 41mm</li>
        <li>Máy: Omega Calibre 8900 Master Chronometer</li>
        <li>Kính sapphire nguyên khối 2 mặt</li>
        <li>Vỏ thép không gỉ 316L cao cấp</li>
      </ul>
      <p>Đồng hồ đã qua sử dụng, còn rất mới, chỉ có đồng hồ, không hộp.</p>
    `,
    startPrice: 55000000
  },
  {
    title: 'Giày Nike Air Jordan 1 Chicago Lost & Found',
    slug: 'nike-air-jordan-1-chicago-lost-found',
    description: `
      <h2>Air Jordan 1 High OG "Chicago Lost & Found"</h2>
      <p>Phiên bản remake huyền thoại của phối màu Chicago năm 1985.</p>
      <ul>
        <li>Size: 42 (US 8.5)</li>
        <li>Tình trạng: New 100% full box, phụ kiện</li>
        <li>Phong cách vintage cực chất</li>
        <li>Cam kết chính hãng bao check trọn đời</li>
      </ul>
      <p>Đôi giày must-have cho mọi sneakerhead.</p>
    `,
    startPrice: 5000000
  }
];

async function seedNearEndingProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] Connected to MongoDB');

    // 1. Find a seller
    const seller = await User.findOne({ filter: { roles: 'seller' } });
    if (!seller) {
        // Fallback: Find ANY admin/seller or user if no specific seller role exists in filter
        // Actually checking logic in User model, roles might be in an array straight up or "role" field
        // Let's try to find based on roles inclusion
        const altSeller = await User.findOne({ roles: 'seller' }); 
        if (!altSeller) {
             console.log('No seller found. Creating one or aborting.');
             // Creating a temp seller if needed, but safer to abort
             console.log('Aborting: No user with role "seller" found.');
             process.exit(1);
        }
        // Use altSeller
    }
    
    // Better logic to get a robust seller
    const sellers = await User.find({ roles: 'seller' }).limit(1);
    let finalSeller = sellers[0];
    
    if (!finalSeller) {
        // Try finding admin to use
        const admin = await User.findOne({ roles: 'admin' });
        if (admin) {
            finalSeller = admin;
            console.log('Using admin as seller');
        } else {
             console.log('No seller or admin found.');
             process.exit(1);
        }
    }
    console.log(`Using seller: ${finalSeller.name} (${finalSeller.email})`);

    // 2. Get Categories
    const categories = await Category.find({ level: 2 }).limit(10); // Get subcategories
    if (categories.length === 0) {
        console.log('No categories found. Run seedData first.');
        process.exit(1);
    }

    // 3. Create products and auctions
    for (let i = 0; i < PRODUCTS_DATA.length; i++) {
        const pData = PRODUCTS_DATA[i];
        const category = categories[i % categories.length];
        const images = getRandomImages(4);
        
        // Unique slug
        const slug = `${pData.slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const product = await Product.create({
            sellerId: finalSeller._id,
            categoryId: category._id,
            title: pData.title,
            slug: slug,
            descriptionHistory: [{ 
                text: pData.description, 
                createdAt: new Date(), 
                authorId: finalSeller._id 
            }],
            primaryImageUrl: images[0],
            imageUrls: images,
            isActive: true,
            baseCurrency: 'VND'
        });

        // Auction ending soon
        // Spread them: 10m, 25m, 40m, 1h, 2h
        const durationsMinutes = [10, 25, 40, 60, 120];
        const duration = durationsMinutes[i % durationsMinutes.length];
        
        const startAt = new Date();
        const endAt = new Date(startAt.getTime() + duration * 60000);

        await Auction.create({
            productId: product._id,
            sellerId: finalSeller._id,
            startPrice: pData.startPrice,
            currentPrice: pData.startPrice,
            bidCount: 0,
            buyNowPrice: pData.startPrice * 2,
            priceStep: pData.startPrice * 0.05,
            startAt: startAt,
            endAt: endAt,
            status: 'active',
            autoExtendEnabled: true
        });

        console.log(`Created product: ${pData.title} | Ends in: ${duration} mins | Category: ${category.name}`);
    }

    console.log('[SEED] 5 Near-ending products created successfully.');
    process.exit(0);

  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exit(1);
  }
}

seedNearEndingProducts();
