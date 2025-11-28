/**
 * ============================================
 * WORK SUMMARY: APIs 1.1 - 1.5 Implementation
 * Dự án: Online Auction Platform
 * Thời gian: 28/11/2025
 * ============================================
 */

/*
## MỤC ĐÍCH CỦA BỘ API NÀY

Triển khai các tính năng chính cho phần Homepage & Product Browsing:

✅ API 1.1: Hệ thống Menu (Danh mục 2 cấp)
   - Lấy tất cả danh mục theo cấp bậc (parent + children)
   - Dùng cho Menu navigation trên Frontend

✅ API 1.2: Trang Chủ (Top 5 Products)
   - Top 5 sản phẩm gần kết thúc
   - Top 5 sản phẩm có nhiều lượt ra giá
   - Top 5 sản phẩm có giá cao nhất

✅ API 1.3: Danh Sách Sản Phẩm Theo Danh Mục
   - Lấy sản phẩm theo danh mục với phân trang
   - Hỗ trợ sắp xếp (giá, thời gian, bids, mới nhất)

✅ API 1.4: Tìm Kiếm Sản Phẩm (Full-text Search)
   - Tìm kiếm toàn bộ theo tên sản phẩm
   - Lọc theo danh mục, khoảng giá
   - Sắp xếp theo giá (tăng/giảm), thời gian kết thúc

✅ API 1.5: Chi Tiết Sản Phẩm
   - Thông tin đầy đủ: tiêu đề, ảnh, mô tả, metadata
   - Thông tin người bán: username, rating
   - Thông tin đấu giá: giá hiện tại, số bids, thời gian còn lại
   - Top 5 bidders gần đây
   - 5 sản phẩm cùng danh mục (related products)

---

## FILES ĐƯỢC TẠO MỚI

### 1. Services Layer
📄 backend/src/services/ProductService.js
   - Class ProductService với các methods:
     * getTopProducts() - lấy top 5 products (3 nhóm)
     * getProductsByCategory() - danh sách theo category + phân trang
     * searchProducts() - full-text search + filters
     * getProductDetail() - chi tiết sản phẩm + related products
     * _formatTopProducts() - helper format dữ liệu

### 2. Controllers
📄 backend/src/controllers/product.js
   - Controllers cho Product endpoints
   - getTopProducts() - xử lý API 1.2
   - getProductsByCategory() - xử lý API 1.3
   - searchProducts() - xử lý API 1.4
   - getProductDetail() - xử lý API 1.5
   - Tất cả có try-catch + console.error logging

📄 backend/src/controllers/category.js
   - Controllers cho Category endpoints
   - getAllCategories() - xử lý API 1.1 (danh sách danh mục)
   - getCategoryBySlug() - lấy danh mục theo slug
   - Có try-catch + console.error logging

### 3. Routes
📄 backend/src/routes/product.js
   - Routes cho tất cả product endpoints
   - GET /api/products/home/top
   - GET /api/products/search
   - GET /api/products/category/:categoryId
   - GET /api/products/:productId

📄 backend/src/routes/category.js
   - Routes cho category endpoints
   - GET /api/categories
   - GET /api/categories/:slug

### 4. Documentation
📄 backend/src/API_DOCUMENTATION_1_1_TO_1_5.js
   - Tài liệu chi tiết tất cả 5 APIs
   - Request/response examples
   - Query parameters
   - Code locations
   - Performance notes
   - Testing with cURL

---

## FILES ĐƯỢC CHỈNH SỬA

### 1. Server Configuration
📝 backend/src/server.js
   - ✅ Thêm import: categoryRoutes, productRoutes
   - ✅ Đăng ký routes: /api/categories, /api/products

### 2. Models (Comment + Indexes)
📝 backend/src/models/Product.js
   - ✅ Thêm detailed comments để identify APIs (1.3, 1.4, 1.5)
   - ✅ Text index: { title: 'text', 'metadata.brand': 'text' } - cho API 1.4
   - ✅ Index: { categoryId: 1, createdAt: -1 } - cho API 1.3
   - ✅ Index: { sellerId: 1 }
   - ✅ Index: { isActive: 1 }

📝 backend/src/models/Category.js
   - ✅ Thêm detailed comments để identify API 1.1
   - ✅ Index: { parentId: 1 } - cho API 1.1 (lấy child categories)
   - ✅ Index: { path: 1 } - cho tree structure queries

---

## CODE STRUCTURE & COMMENTS

### Comment Convention Dùng Trong Dự Án:
```javascript
// API X.Y: [Tên API]
// [Mô tả chi tiết]
export const functionName = async (req, res, next) => {
  try {
    console.log('[CONTROLLER NAME] Mô tả hành động');
    // Implementation
  } catch (error) {
    console.error('[CONTROLLER NAME] Lỗi: ', error);
    next(error);
  }
};
```

### All API Endpoints Follow This Pattern:
1. ✅ Explicit try-catch blocks
2. ✅ console.log() cho successful operations
3. ✅ console.error() trong catch blocks
4. ✅ AppError throws với proper status codes
5. ✅ Input validation
6. ✅ Proper HTTP response format

---

## DATABASE INDEXES ĐƯỢC THÊM

### Product Collection Indexes:
```
1. Text Index: { title: 'text', 'metadata.brand': 'text' }
   → Dùng cho full-text search (API 1.4)

2. Compound Index: { categoryId: 1, createdAt: -1 }
   → Dùng cho danh sách theo category + sort by date (API 1.3)

3. Single Index: { sellerId: 1 }
   → Dùng cho filtering by seller

4. Single Index: { isActive: 1 }
   → Dùng cho filtering active products
```

### Category Collection Indexes:
```
1. Single Index: { parentId: 1 }
   → Dùng cho lấy child categories (API 1.1)

2. Single Index: { path: 1 }
   → Dùng cho tree structure queries
```

---

## ARCHITECTURE LAYERS

### Tầng 1: Routes (entry points)
- Routes định nghĩa các endpoint và gọi controllers

### Tầng 2: Controllers (HTTP handlers)
- Xử lý request parameters
- Validation
- Gọi services
- Format response
- Error handling

### Tầng 3: Services (business logic)
- Chứa tất cả business logic
- Aggregation pipeline queries
- Data transformations
- Tính toán (timeRemaining, etc)

### Tầng 4: Models (data access)
- MongoDB schemas
- Indexes
- Pre/post hooks

### Tầng 5: Utils (helpers)
- Error class (AppError)
- Validators
- JWT utilities

---

## QUERY OPTIMIZATION

### 1. MongoDB Indexes
✅ Text index cho full-text search
✅ Compound indexes để avoid multiple index scans
✅ Lean queries (.lean()) để trả về plain objects

### 2. Aggregation Pipeline
✅ $match - filter early
✅ $lookup - join collections efficiently
✅ $unwind - flatten arrays
✅ $sort - sau filtering
✅ $skip/$limit - pagination

### 3. Projection
✅ Select only needed fields
✅ Avoid returning entire nested documents

### 4. Pagination
✅ Limit default 12, max 100
✅ Prevent loading all data at once

---

## TESTING THE APIS

### cURL Commands:

# API 1.1: Danh mục
curl http://localhost:5001/api/categories

# API 1.2: Top products
curl http://localhost:5001/api/products/home/top

# API 1.3: Danh sách theo category
curl "http://localhost:5001/api/products/category/[categoryId]?page=1&limit=12&sortBy=newest"

# API 1.4: Tìm kiếm
curl "http://localhost:5001/api/products/search?q=iPhone&sortBy=price_desc"

# API 1.5: Chi tiết
curl "http://localhost:5001/api/products/[productId]"

---

## ERROR HANDLING

✅ All endpoints validate input
✅ Proper HTTP status codes:
   - 200: Success
   - 400: Invalid input
   - 404: Not found
   - 500: Server error

✅ Consistent error response format:
{
  "status": "error",
  "statusCode": 400,
  "code": "ERROR_CODE",
  "message": "Chi tiết lỗi",
  "timestamp": "2025-11-28T10:30:00Z"
}

---

## GIT COMMIT MESSAGE RECOMMENDATION

```
feat: Implement APIs 1.1-1.5 for Homepage & Product Browsing

- Add ProductService with getTopProducts, getProductsByCategory, searchProducts, getProductDetail
- Add ProductController and CategoryController with proper error handling
- Create product.js and category.js route files
- Add text indexes to Product model for full-text search
- Add compound indexes to improve query performance
- Implement hierarchical category structure (2-level)
- Support pagination, sorting, and filtering in product listing
- Add comprehensive API documentation (API_DOCUMENTATION_1_1_TO_1_5.js)
- All endpoints follow try-catch pattern with console logging

APIs implemented:
- API 1.1: Category menu (2-level hierarchy)
- API 1.2: Top 5 products for homepage
- API 1.3: Product listing by category with pagination
- API 1.4: Full-text search with filters (heavy API)
- API 1.5: Product details with related products
```

---

## NEXT STEPS (Để làm tiếp)

❌ API 1.6: Thêm sản phẩm vào watchlist
❌ API 1.7: Xem lịch sử tìm kiếm
❌ API 1.8: Gợi ý sản phẩm tương tự
❌ Admin: Quản lý danh mục
❌ Caching: Redis cho top products
❌ Performance: Optimize aggregation pipelines

---

End of Summary
*/

export default {};
