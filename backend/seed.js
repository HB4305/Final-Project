// seed.js - Phiên bản Full Data (20 Products + Auto Bids)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load Models (Đảm bảo đường dẫn đúng với cấu trúc folder của bạn)
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Bid = require('./src/models/Bid');

// Hàm random số nguyên
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected for Seeding...'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const importData = async () => {
    try {
        console.log('--- BẮT ĐẦU CLEAN DATA ---');
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await Bid.deleteMany();
        console.log('Đã xóa dữ liệu cũ.');

        // 1. TẠO USERS
        console.log('--- TẠO USERS ---');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const users = await User.insertMany([
            { fullName: 'Admin Quản Trị', email: 'admin@gmail.com', password: hashedPassword, role: 'admin', address: 'HCM' },
            { fullName: 'Seller Uy Tín', email: 'seller@gmail.com', password: hashedPassword, role: 'seller', address: 'HN', goodRatings: 50, badRatings: 1 },
            // Tạo nhiều Bidder để giả lập đấu giá xôm tụ
            { fullName: 'Phạm Văn Mua', email: 'bidder1@gmail.com', password: hashedPassword, role: 'bidder', address: 'Đà Nẵng', goodRatings: 5, badRatings: 0 },
            { fullName: 'Trần Thị Giàu', email: 'bidder2@gmail.com', password: hashedPassword, role: 'bidder', address: 'Cần Thơ', goodRatings: 10, badRatings: 0 },
            { fullName: 'Lê Hoài Bảo', email: 'bidder3@gmail.com', password: hashedPassword, role: 'bidder', address: 'HCM', goodRatings: 2, badRatings: 0 },
            { fullName: 'Nguyễn Đại Gia', email: 'bidder4@gmail.com', password: hashedPassword, role: 'bidder', address: 'Hải Phòng', goodRatings: 8, badRatings: 1 },
            { fullName: 'Thích Đấu Giá', email: 'bidder5@gmail.com', password: hashedPassword, role: 'bidder', address: 'Huế', goodRatings: 0, badRatings: 0 },
        ]);

        const seller = users[1];
        const bidders = users.slice(2); // Lấy danh sách bidder (từ index 2 trở đi)

        // 2. TẠO CATEGORIES (2 Cấp)
        console.log('--- TẠO CATEGORIES ---');
        // Cấp 1
        const electronics = await Category.create({ name: 'Điện tử', parent: null });
        const fashion = await Category.create({ name: 'Thời trang', parent: null });

        // Cấp 2
        const phones = await Category.create({ name: 'Điện thoại di động', parent: electronics._id });
        const laptops = await Category.create({ name: 'Máy tính xách tay', parent: electronics._id });
        const cameras = await Category.create({ name: 'Máy ảnh & Quay phim', parent: electronics._id });
        const watches = await Category.create({ name: 'Đồng hồ', parent: fashion._id });
        const shoes = await Category.create({ name: 'Giày dép', parent: fashion._id });

        // 3. TẠO 20 SẢN PHẨM
        console.log('--- TẠO PRODUCTS ---');

        // Hàm helper để tạo object sản phẩm nhanh
        const createProductObj = (name, catId, price, img, desc, daysLeft = 3) => {
            const now = new Date();
            return {
                name: name,
                category: catId,
                seller: seller._id,
                startPrice: price,
                currentPrice: price, // Ban đầu bằng giá khởi điểm
                stepPrice: 100000,   // Bước giá 100k
                buyNowPrice: price * 2,
                images: [img, 'https://via.placeholder.com/600x400', 'https://via.placeholder.com/600x400'], // Ảnh chính + 2 ảnh dummy
                description: desc,
                postDate: now,
                endDate: new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000), // daysLeft ngày nữa kết thúc
                status: 'active'
            };
        };

        const productList = [
            // --- ĐIỆN THOẠI (5 cái) ---
            createProductObj('iPhone 15 Pro Max 256GB Titan', phones._id, 28000000, 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-thumbnew-600x600.jpg', '<p>Hàng chính hãng VN/A, mới active 1 tuần.</p>', 1),
            createProductObj('Samsung Galaxy S24 Ultra', phones._id, 25000000, 'https://cdn.tgdd.vn/Products/Images/42/307174/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg', '<p>Siêu phẩm AI, bút S-Pen quyền năng.</p>', 3),
            createProductObj('Xiaomi 14 Ultra', phones._id, 20000000, 'https://cdn.tgdd.vn/Products/Images/42/314664/xiaomi-14-ultra-den-thumb-600x600.jpg', '<p>Camera Leica đỉnh cao nhiếp ảnh.</p>', 7),
            createProductObj('OPPO Find N3 Flip', phones._id, 18000000, 'https://cdn.tgdd.vn/Products/Images/42/309823/oppo-find-n3-flip-hong-thumb-600x600.jpg', '<p>Điện thoại gập nhỏ gọn, thời trang.</p>', 0.1), // Sắp hết hạn (vài giờ)
            createProductObj('Google Pixel 8 Pro', phones._id, 15000000, 'https://cdn.tgdd.vn/Products/Images/42/313337/google-pixel-8-pro-xanh-duong-thumb-600x600.jpg', '<p>Android gốc mượt mà, camera AI.</p>', 5),

            // --- LAPTOP (5 cái) ---
            createProductObj('MacBook Air M2 13 inch', laptops._id, 23000000, 'https://cdn.tgdd.vn/Products/Images/44/282827/macbook-air-m2-2022-gray-thumb-600x600.jpg', '<p>Thiết kế mỏng nhẹ, pin trâu cả ngày.</p>', 2),
            createProductObj('Asus ROG Strix G16', laptops._id, 30000000, 'https://cdn.tgdd.vn/Products/Images/44/314050/asus-rog-strix-g16-g614ju-i7-n377w-thumb-600x600.jpg', '<p>Laptop Gaming cấu hình khủng, màn 240Hz.</p>', 4),
            createProductObj('Dell XPS 13 Plus', laptops._id, 35000000, 'https://cdn.tgdd.vn/Products/Images/44/304386/dell-xps-13-plus-9320-i7-1yrh6-thumb-600x600.jpg', '<p>Sang trọng, đẳng cấp doanh nhân.</p>', 6),
            createProductObj('Lenovo ThinkPad X1 Carbon', laptops._id, 28000000, 'https://cdn.tgdd.vn/Products/Images/44/309605/lenovo-thinkpad-x1-carbon-gen-11-i7-21hm001jvn-thumb-600x600.jpg', '<p>Bàn phím gõ sướng nhất thế giới.</p>', 0.2), // Sắp hết
            createProductObj('Acer Swift Go 14 AI', laptops._id, 19000000, 'https://cdn.tgdd.vn/Products/Images/44/313083/acer-swift-go-14-sfg14-71-74xz-i7-nxkfsv002-thumb-600x600.jpg', '<p>Laptop AI mỏng nhẹ, màn OLED đẹp.</p>', 3),

            // --- MÁY ẢNH (3 cái) ---
            createProductObj('Sony Alpha A7 IV Body', cameras._id, 45000000, 'https://cdn.tgdd.vn/Products/Images/4862/263628/sony-alpha-a7-mark-iv-body-thumb-600x600.jpg', '<p>Máy ảnh Fullframe hybrid tốt nhất.</p>', 5),
            createProductObj('Fujifilm X-T5', cameras._id, 38000000, 'https://cdn.tgdd.vn/Products/Images/4862/298468/fujifilm-x-t5-body-bac-thumb-600x600.jpg', '<p>Màu phim hoài cổ, chụp đẹp ngay.</p>', 2),
            createProductObj('Canon EOS R6 Mark II', cameras._id, 50000000, 'https://cdn.tgdd.vn/Products/Images/4862/302488/canon-eos-r6-mark-ii-body-thumb-600x600.jpg', '<p>Tốc độ chụp liên tục cực nhanh.</p>', 7),

            // --- ĐỒNG HỒ (4 cái) ---
            createProductObj('Apple Watch Ultra 2', watches._id, 18000000, 'https://cdn.tgdd.vn/Products/Images/7077/315998/apple-watch-ultra-2-lte-49mm-vien-titan-day-vai-cam-be-thumb-600x600.jpg', '<p>Bền bỉ, pin trâu, chuyên cho thể thao.</p>', 1),
            createProductObj('Samsung Galaxy Watch 6 Classic', watches._id, 6000000, 'https://cdn.tgdd.vn/Products/Images/7077/308412/samsung-galaxy-watch6-classic-lte-43mm-den-thumb-600x600.jpg', '<p>Vòng bezel xoay vật lý độc đáo.</p>', 3),
            createProductObj('Casio G-Shock GA-2100', watches._id, 3000000, 'https://cdn.tgdd.vn/Products/Images/7264/225642/casio-ga-2100-1a1dr-nam-1-600x600.jpg', '<p>Nồi đồng cối đá, thiết kế bát giác.</p>', 4),
            createProductObj('Orient Bambino Gen 2', watches._id, 4500000, 'https://cdn.tgdd.vn/Products/Images/7264/233066/orient-fac00009n0-nam-1-600x600.jpg', '<p>Kính cong vòm, style cổ điển lịch lãm.</p>', 2),

            // --- GIÀY (3 cái) ---
            createProductObj('Nike Air Jordan 1 Low', shoes._id, 3500000, 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/043e0e98-299f-4318-867c-9b768a49c403/air-jordan-1-low-se-shoes-H7DD5v.png', '<p>Huyền thoại đường phố, phối màu đẹp.</p>', 5),
            createProductObj('Adidas Ultraboost Light', shoes._id, 4000000, 'https://assets.adidas.com/images/w_600,f_auto,q_auto/43632906e53d4c42b65daf120005a306_9366/Giay_Ultraboost_Light_trang_HQ6353_01_standard.jpg', '<p>Êm ái nhất, chạy bộ cực thích.</p>', 6),
            createProductObj('Bitis Hunter X', shoes._id, 1200000, 'https://product.hstatic.net/1000230642/product/dsmh10600den__1__2b0c3451792442488d55d2105e463870_master.jpg', '<p>Tự hào thương hiệu Việt, đế cao su nhẹ.</p>', 3),
        ];

        // Insert sản phẩm vào DB và lấy lại danh sách đã có ID
        const insertedProducts = await Product.insertMany(productList);
        console.log(`Đã tạo ${insertedProducts.length} sản phẩm.`);

        // 4. TẠO AUTO BIDS (Mỗi sản phẩm 5-8 lượt bid)
        console.log('--- TẠO BIDS NGẪU NHIÊN ---');

        for (const product of insertedProducts) {
            let currentPrice = product.startPrice;
            let lastBidder = null;

            // Số lượt bid ngẫu nhiên từ 5 đến 10
            const numberOfBids = randomInt(5, 10);

            for (let i = 0; i < numberOfBids; i++) {
                // Chọn random 1 bidder
                const randomBidder = bidders[randomInt(0, bidders.length - 1)];

                // Tăng giá (Bước giá + random dư một chút)
                const priceIncrease = product.stepPrice * randomInt(1, 3);
                currentPrice += priceIncrease;

                // Tạo lịch sử bid
                await Bid.create({
                    product: product._id,
                    bidder: randomBidder._id,
                    price: currentPrice,
                    time: new Date(Date.now() - randomInt(1, 1000) * 60 * 1000) // Thời gian trong quá khứ
                });

                lastBidder = randomBidder._id;
            }

            // Cập nhật lại giá cuối cùng và người thắng cho sản phẩm
            await Product.findByIdAndUpdate(product._id, {
                currentPrice: currentPrice,
                highestBidder: lastBidder,
                bidCount: numberOfBids // Nếu trong model Product bạn có trường này (khuyên dùng để đỡ count lại)
            });
        }

        console.log('Đã tạo dữ liệu đấu giá ngẫu nhiên thành công!');
        console.log('--- SEEDING HOÀN TẤT ---');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

importData();