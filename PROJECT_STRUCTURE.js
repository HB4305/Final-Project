// /**
//  * ============================================
//  * PROJECT STRUCTURE - APIs 1.1 to 1.5
//  * ============================================
//  */

// /*

// BACKEND FOLDER STRUCTURE (After APIs 1.1-1.5 Implementation)

// backend/
// ├── src/
// │   ├── controllers/
// │   │   ├── auth.js                          ✅ Existing (Auth controllers)
// │   │   ├── auction.js                       ✅ Existing (Auction controllers)
// │   │   ├── bid.js                           ✅ Existing (Bid controllers)
// │   │   ├── rating.js                        ✅ Existing (Rating controllers)
// │   │   ├── placeholder.js                   ✅ Existing
// │   │   ├── product.js                       ✨ NEW (APIs 1.2, 1.3, 1.4, 1.5)
// │   │   └── category.js                      ✨ NEW (API 1.1)
// │   │
// │   ├── routes/
// │   │   ├── auth.js                          ✅ Existing
// │   │   ├── auction.js                       ✅ Existing
// │   │   ├── bid.js                           ✅ Existing
// │   │   ├── rating.js                        ✅ Existing
// │   │   ├── placeholder.js                   ✅ Existing
// │   │   ├── product.js                       ✨ NEW (APIs 1.2-1.5)
// │   │   └── category.js                      ✨ NEW (API 1.1)
// │   │
// │   ├── services/
// │   │   ├── AuthService.js                   ✅ Existing
// │   │   ├── AuctionService.js                ✅ Existing
// │   │   ├── BidService.js                    ✅ Existing
// │   │   ├── RatingService.js                 ✅ Existing
// │   │   ├── NotificationService.js           ✅ Existing
// │   │   └── ProductService.js                ✨ NEW (APIs 1.2-1.5)
// │   │
// │   ├── models/
// │   │   ├── User.js                          ✅ Existing
// │   │   ├── Product.js                       📝 MODIFIED (added indexes + comments)
// │   │   ├── Category.js                      📝 MODIFIED (added comments + indexes)
// │   │   ├── Auction.js                       ✅ Existing (used by API 1.2, 1.5)
// │   │   ├── Bid.js                           ✅ Existing (used by API 1.5)
// │   │   ├── Order.js                         ✅ Existing
// │   │   ├── Rating.js                        ✅ Existing
// │   │   ├── Watchlist.js                     ✅ Existing
// │   │   ├── AutoBid.js                       ✅ Existing
// │   │   ├── Question.js                      ✅ Existing
// │   │   ├── Notification.js                  ✅ Existing
// │   │   ├── RejectedBidder.js                ✅ Existing
// │   │   ├── AuditLog.js                      ✅ Existing
// │   │   ├── SystemSetting.js                 ✅ Existing
// │   │   ├── ChatMessage.js                   ✅ Existing
// │   │   └── index.js                         ✅ Existing
// │   │
// │   ├── middlewares/
// │   │   ├── auth.js                          ✅ Existing (with try-catch)
// │   │   ├── roles.js                         ✅ Existing (with try-catch)
// │   │   ├── validation.js                    ✅ Existing (with try-catch)
// │   │   └── errorHandler.js                  ✅ Existing (with try-catch)
// │   │
// │   ├── utils/
// │   │   ├── errors.js                        ✅ Existing (AppError)
// │   │   ├── jwt.js                           ✅ Existing (JWT utilities with logging)
// │   │   └── validators.js                    ✅ Existing (input validators with error handling)
// │   │
// │   ├── lib/
// │   │   ├── constants.js                     ✅ Existing
// │   │   └── database.js                      ✅ Existing
// │   │
// │   └── server.js                            📝 MODIFIED (added category + product routes)
// │
// ├── .env                                     ⚠️ REMOVED from git (in .gitignore)
// ├── .gitignore                               ✅ Has: node_modules, .env
// ├── package.json                             ✅ Existing
// └── README.md                                ✅ Existing

// ---

// ROOT FOLDER DOCUMENTATION

// Final-Project/
// ├── backend/                                 (Backend implementation)
// ├── src/                                     (Frontend implementation - not covered here)
// ├── index.html                               ✅ Existing
// ├── package.json                             ✅ Existing
// ├── vite.config.js                           ✅ Existing
// ├── eslint.config.js                         ✅ Existing
// │
// ├── API_DOCUMENTATION_1_1_TO_1_5.js          ✨ NEW (Comprehensive API docs)
// ├── WORK_SUMMARY_API_1_1_TO_1_5.js           ✨ NEW (Detailed implementation summary)
// └── IMPLEMENTATION_CHECKLIST.js              ✨ NEW (Testing & deployment checklist)

// ---

// ## FILES CREATED/MODIFIED DETAILED LIST

// ### CREATED (7 files):

// 1️⃣ backend/src/services/ProductService.js
//    - ProductService class
//    - getTopProducts() method
//    - getProductsByCategory() method
//    - searchProducts() method (full-text search)
//    - getProductDetail() method
//    - _formatTopProducts() helper

// 2️⃣ backend/src/controllers/product.js
//    - getTopProducts() controller
//    - getProductsByCategory() controller
//    - searchProducts() controller
//    - getProductDetail() controller
//    - Input validation
//    - Error handling

// 3️⃣ backend/src/controllers/category.js
//    - getAllCategories() controller
//    - getCategoryBySlug() controller
//    - Hierarchical structure building

// 4️⃣ backend/src/routes/product.js
//    - GET /api/products/home/top
//    - GET /api/products/search
//    - GET /api/products/category/:categoryId
//    - GET /api/products/:productId

// 5️⃣ backend/src/routes/category.js
//    - GET /api/categories
//    - GET /api/categories/:slug

// 6️⃣ API_DOCUMENTATION_1_1_TO_1_5.js
//    - Complete API documentation
//    - Request/response examples
//    - Query parameters
//    - Error codes
//    - cURL testing examples

// 7️⃣ WORK_SUMMARY_API_1_1_TO_1_5.js
//    - Implementation overview
//    - Files created/modified
//    - Architecture description
//    - Next steps

// ---

// ### MODIFIED (3 files):

// 1️⃣ backend/src/server.js
//    Line changes:
//    - Added: import categoryRoutes
//    - Added: import productRoutes
//    - Added: app.use('/api/categories', categoryRoutes)
//    - Added: app.use('/api/products', productRoutes)

// 2️⃣ backend/src/models/Product.js
//    Changes:
//    - Added detailed comments for API 1.3, 1.4, 1.5
//    - Added text index: { title: 'text', 'metadata.brand': 'text' }
//    - Added index: { isActive: 1 }
//    - Kept existing indexes

// 3️⃣ backend/src/models/Category.js
//    Changes:
//    - Added detailed comments for API 1.1
//    - Kept existing indexes unchanged
//    - Added field descriptions

// ---

// ## API ENDPOINTS MAPPING

// ┌─────────────────────────────────────────────────────────────┐
// │ API  │ HTTP   │ Endpoint                  │ Controller      │
// ├──────┼────────┼──────────────────────────┼─────────────────┤
// │ 1.1  │ GET    │ /api/categories           │ category.js     │
// │      │        │                           │ getAllCategories│
// ├──────┼────────┼──────────────────────────┼─────────────────┤
// │ 1.2  │ GET    │ /api/products/home/top    │ product.js      │
// │      │        │                           │ getTopProducts  │
// ├──────┼────────┼──────────────────────────┼─────────────────┤
// │ 1.3  │ GET    │ /api/products/category/:id│ product.js      │
// │      │        │                           │ getProductsByC..│
// ├──────┼────────┼──────────────────────────┼─────────────────┤
// │ 1.4  │ GET    │ /api/products/search      │ product.js      │
// │      │        │ ?q=keyword&sortBy=price   │ searchProducts  │
// ├──────┼────────┼──────────────────────────┼─────────────────┤
// │ 1.5  │ GET    │ /api/products/:productId  │ product.js      │
// │      │        │                           │ getProductDetail│
// └──────┴────────┴──────────────────────────┴─────────────────┘

// ---

// ## DATA FLOW EXAMPLE (API 1.3)

// Frontend Request
//     ↓
// GET /api/products/category/507f1f77bcf86cd799439011?page=1&limit=12
//     ↓
// Express Router (routes/product.js)
//     ↓
// ProductController.getProductsByCategory()
//     │
//     ├─ Validate input (categoryId format, sort option)
//     ├─ Log: '[PRODUCT CONTROLLER] GET /api/products/category/...'
//     │
//     ↓
// ProductService.getProductsByCategory()
//     │
//     ├─ Build MongoDB query: { categoryId, isActive: true }
//     ├─ Build aggregation pipeline:
//     │   ├─ $match: filter by categoryId
//     │   ├─ $lookup: join with Auction collection
//     │   ├─ $unwind: flatten auction array
//     │   ├─ $lookup: join with User (seller info)
//     │   ├─ $sort: by createdAt (or price, etc)
//     │   ├─ $skip: (page-1)*limit
//     │   ├─ $limit: limit
//     │   ├─ $project: select only needed fields
//     │
//     ├─ Execute: Product.aggregate(pipeline)
//     ├─ Get total count: Product.countDocuments(query)
//     ├─ Log: '[PRODUCT SERVICE] Found X products'
//     │
//     ↓
// MongoDB
//     │
//     ├─ Use index: { categoryId: 1, createdAt: -1 }
//     ├─ Fetch matching products
//     ├─ Join with Auctions
//     ├─ Join with Users
//     │
//     ↓
// Return formatted data
//     │
//     ├─ data: [ products array ]
//     ├─ pagination: { page, limit, total, pages }
//     │
//     ↓
// Format Response
//     {
//       status: 'success',
//       message: 'Lấy danh sách sản phẩm thành công',
//       data: [...],
//       pagination: {...},
//       timestamp: '2025-11-28T10:30:00Z'
//     }
//     │
//     ↓
// Frontend (UI renders the products)

// ---

// ## DATABASE INDEXES CREATED

// ### Product Collection
// ┌────────────────────────────────────────────┐
// │ Index Type     │ Fields                     │ Usage          │
// ├────────────────┼────────────────────────────┼────────────────┤
// │ Text Index     │ title, metadata.brand      │ API 1.4 Search │
// │ Compound       │ categoryId, createdAt(-1)  │ API 1.3 List   │
// │ Single         │ sellerId                   │ Filter seller  │
// │ Single         │ isActive                   │ Filter active  │
// └────────────────┴────────────────────────────┴────────────────┘

// ### Category Collection
// ┌────────────────────────────────────────────┐
// │ Index Type     │ Fields                     │ Usage          │
// ├────────────────┼────────────────────────────┼────────────────┤
// │ Single         │ parentId                   │ API 1.1 List   │
// │ Single         │ path                       │ Tree queries   │
// └────────────────┴────────────────────────────┴────────────────┘

// ---

// ## COMMENTS IN CODE

// All API sections marked with:
// /**
//  * API X.Y: [Tên API]
//  * [Chi tiết]
//  */

// Example:
// /**
//  * API 1.3: Danh sách sản phẩm theo danh mục (phân trang)
//  * Hỗ trợ sắp xếp theo...
//  */

// ---

// ## GIT STATUS AFTER WORK

// Untracked files:
//   backend/src/services/ProductService.js
//   backend/src/controllers/product.js
//   backend/src/controllers/category.js
//   backend/src/routes/product.js
//   backend/src/routes/category.js
//   API_DOCUMENTATION_1_1_TO_1_5.js
//   WORK_SUMMARY_API_1_1_TO_1_5.js
//   IMPLEMENTATION_CHECKLIST.js

// Modified files:
//   backend/src/server.js
//   backend/src/models/Product.js
//   backend/src/models/Category.js

// ---

// ## READY FOR COMMIT

// git add .
// git commit -m "feat: Implement APIs 1.1-1.5 for Product Browsing

// - Add ProductService with business logic for 4 product APIs
// - Add ProductController and CategoryController
// - Create product and category route files
// - Add text and compound indexes to models
// - Implement full-text search with filters and pagination
// - Add hierarchical category structure (2-level)
// - Include comprehensive API documentation
// - All endpoints have try-catch error handling"

// git push origin BaoPham/database

// */

// export default {};
