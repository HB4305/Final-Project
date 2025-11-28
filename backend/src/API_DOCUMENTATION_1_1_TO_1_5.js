/**
 * ============================================
 * API DOCUMENTATION (1.1 - 1.5)
 * ============================================
 * Tài liệu hướng dẫn tất cả các API endpoints
 * cho phần Homepage & Product Browsing
 * 
 * Người viết: Backend Team
 * Ngày: 28/11/2025
 * ============================================
 */

/*
## API 1.1: Hệ thống Menu (Danh mục 2 cấp)

### Endpoint: GET /api/categories
Lấy tất cả danh mục với cấu trúc 2 cấp (parent + children)

**Response:**
```json
{
  "status": "success",
  "message": "Lấy danh mục thành công",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Điện tử",
      "slug": "dien-tu",
      "level": 1,
      "children": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Điện thoại",
          "slug": "dien-thoai",
          "parentId": "507f1f77bcf86cd799439011",
          "level": 2
        },
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Laptop",
          "slug": "laptop",
          "parentId": "507f1f77bcf86cd799439011",
          "level": 2
        }
      ]
    }
  ],
  "timestamp": "2025-11-28T10:30:00Z"
}
```

**Code location:**
- Controller: `backend/src/controllers/category.js` → `getAllCategories()`
- Route: `backend/src/routes/category.js`
- Model: `backend/src/models/Category.js`

---

## API 1.2: Trang chủ - Top 5 sản phẩm

### Endpoint: GET /api/products/home/top
Lấy 3 nhóm top 5 sản phẩm cho trang chủ:
- Gần kết thúc (endingSoon)
- Nhiều lượt ra giá nhất (mostBids)
- Giá cao nhất (highestPrice)

**Response:**
```json
{
  "status": "success",
  "message": "Lấy top products thành công",
  "data": {
    "endingSoon": [
      {
        "auctionId": "507f1f77bcf86cd799439020",
        "product": {
          "productId": "507f1f77bcf86cd799439011",
          "title": "iPhone 15 Pro Max",
          "image": "https://..."
        },
        "currentPrice": 25000000,
        "bidCount": 12,
        "endAt": "2025-11-28T18:00:00Z",
        "timeRemaining": 28800000,
        "currentHighestBidder": "user123"
      }
    ],
    "mostBids": [...],
    "highestPrice": [...]
  },
  "timestamp": "2025-11-28T10:30:00Z"
}
```

**Code location:**
- Controller: `backend/src/controllers/product.js` → `getTopProducts()`
- Service: `backend/src/services/ProductService.js` → `getTopProducts()`
- Route: `backend/src/routes/product.js`

---

## API 1.3: Danh sách sản phẩm theo danh mục (Phân trang)

### Endpoint: GET /api/products/category/:categoryId?page=1&limit=12&sortBy=newest

Lấy danh sách sản phẩm theo danh mục với phân trang

**Query Parameters:**
- `categoryId` (required): ID danh mục
- `page` (optional, default=1): Số trang
- `limit` (optional, default=12): Số sản phẩm/trang
- `sortBy` (optional, default='newest'): Cách sắp xếp
  - `newest`: Mới nhất
  - `price_asc`: Giá thấp đến cao
  - `price_desc`: Giá cao đến thấp
  - `ending_soon`: Gần kết thúc
  - `most_bids`: Nhiều bids nhất

**Example Request:**
```
GET /api/products/category/507f1f77bcf86cd799439011?page=1&limit=12&sortBy=price_desc
```

**Response:**
```json
{
  "status": "success",
  "message": "Lấy danh sách sản phẩm thành công",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "title": "iPhone 15 Pro",
      "primaryImageUrl": "https://...",
      "createdAt": "2025-11-20T10:00:00Z",
      "auction": {
        "_id": "507f1f77bcf86cd799439040",
        "currentPrice": 22000000,
        "bidCount": 15,
        "endAt": "2025-11-28T18:00:00Z"
      },
      "seller": {
        "username": "seller1",
        "ratingSummary": { "score": 4.5 }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 156,
    "pages": 13
  },
  "timestamp": "2025-11-28T10:30:00Z"
}
```

**Code location:**
- Controller: `backend/src/controllers/product.js` → `getProductsByCategory()`
- Service: `backend/src/services/ProductService.js` → `getProductsByCategory()`
- Route: `backend/src/routes/product.js`
- Model: `backend/src/models/Product.js` (indexes for categoryId, createdAt)

---

## API 1.4: Tìm kiếm sản phẩm (Full-text Search) - API NẶNG

### Endpoint: GET /api/products/search?q=keyword&sortBy=price_desc

Tìm kiếm sản phẩm với full-text search, hỗ trợ lọc và sắp xếp

**Query Parameters:**
- `q` (required): Từ khóa tìm kiếm (ít nhất 2 ký tự)
- `categoryId` (optional): Lọc theo danh mục
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa
- `sortBy` (optional, default='relevance'): Cách sắp xếp
  - `relevance`: Độ liên quan (mặc định)
  - `price_asc`: Giá thấp đến cao
  - `price_desc`: Giá cao đến thấp
  - `ending_soon`: Gần kết thúc
  - `most_bids`: Nhiều bids nhất
- `page` (optional, default=1): Số trang
- `limit` (optional, default=12): Số sản phẩm/trang

**Example Request:**
```
GET /api/products/search?q=iPhone&categoryId=507f1f77bcf86cd799439011&minPrice=15000000&maxPrice=30000000&sortBy=price_desc&page=1&limit=12
```

**Response:**
```json
{
  "status": "success",
  "message": "Tìm kiếm sản phẩm thành công",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "title": "iPhone 15 Pro Max",
      "primaryImageUrl": "https://...",
      "auction": {
        "currentPrice": 25000000,
        "bidCount": 20,
        "endAt": "2025-11-28T18:00:00Z"
      },
      "score": 3.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 234,
    "pages": 20
  },
  "query": "iPhone",
  "timestamp": "2025-11-28T10:30:00Z"
}
```

**Code location:**
- Controller: `backend/src/controllers/product.js` → `searchProducts()`
- Service: `backend/src/services/ProductService.js` → `searchProducts()`
- Route: `backend/src/routes/product.js`
- Model: `backend/src/models/Product.js` (text index on title + metadata.brand)

**Performance Notes:**
- Sử dụng MongoDB text index cho full-text search
- Hỗ trợ aggregation pipeline để join với Auction
- Có thể chậm nếu dataset lớn, cần thêm caching

---

## API 1.5: Chi tiết sản phẩm (Đầy đủ)

### Endpoint: GET /api/products/:productId

Lấy chi tiết sản phẩm với:
- Thông tin sản phẩm đầy đủ (tiêu đề, ảnh, mô tả, metadata)
- Thông tin người bán (username, email, rating)
- Thông tin phiên đấu giá hiện tại (giá, số bids, thời gian còn lại)
- Top 5 bidders gần đây
- 5 sản phẩm cùng danh mục (related products)

**Response:**
```json
{
  "status": "success",
  "message": "Lấy chi tiết sản phẩm thành công",
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439030",
      "title": "iPhone 15 Pro Max",
      "slug": "iphone-15-pro-max",
      "description": "Mô tả chi tiết sản phẩm...",
      "descriptionHistory": [
        { "text": "...", "createdAt": "2025-11-20T10:00:00Z", "authorId": "..." }
      ],
      "primaryImageUrl": "https://...",
      "imageUrls": ["https://...", "https://...", "https://..."],
      "categoryId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Điện thoại",
        "slug": "dien-thoai"
      },
      "sellerId": {
        "_id": "507f1f77bcf86cd799439050",
        "username": "seller1",
        "email": "seller1@example.com",
        "profileImageUrl": "https://...",
        "ratingSummary": {
          "countPositive": 150,
          "countNegative": 5,
          "totalCount": 155,
          "score": 4.8
        }
      },
      "metadata": {
        "brand": "Apple",
        "model": "iPhone 15 Pro Max",
        "condition": "Mới 100%",
        "specs": {
          "storage": "256GB",
          "color": "Space Black"
        }
      },
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-22T15:30:00Z",
      "auction": {
        "_id": "507f1f77bcf86cd799439040",
        "currentPrice": 25000000,
        "bidCount": 20,
        "endAt": "2025-11-28T18:00:00Z",
        "startPrice": 20000000,
        "priceStep": 100000,
        "buyNowPrice": 26000000,
        "autoExtendEnabled": true,
        "currentHighestBidderId": "507f1f77bcf86cd799439060",
        "timeRemaining": 28800000,
        "isActive": true,
        "topBidders": [
          {
            "amount": 25000000,
            "bidderUsername": "bidder1",
            "bidderRating": 4.5,
            "createdAt": "2025-11-28T10:00:00Z"
          },
          {
            "amount": 24900000,
            "bidderUsername": "bidder2",
            "bidderRating": 4.7,
            "createdAt": "2025-11-28T09:50:00Z"
          }
        ]
      }
    },
    "relatedProducts": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "title": "iPhone 15 Pro",
        "primaryImageUrl": "https://...",
        "auction": {
          "_id": "507f1f77bcf86cd799439041",
          "currentPrice": 22000000,
          "bidCount": 15,
          "endAt": "2025-11-29T14:00:00Z",
          "timeRemaining": 100800000
        }
      }
    ]
  },
  "timestamp": "2025-11-28T10:30:00Z"
}
```

**Code location:**
- Controller: `backend/src/controllers/product.js` → `getProductDetail()`
- Service: `backend/src/services/ProductService.js` → `getProductDetail()`
- Route: `backend/src/routes/product.js`
- Models: 
  - `backend/src/models/Product.js`
  - `backend/src/models/Auction.js`
  - `backend/src/models/Bid.js`
  - `backend/src/models/User.js`

---

## Summary of API Endpoints

| #   | API   | Method | Endpoint | Tính năng |
|-----|-------|--------|----------|----------|
| 1.1 | Menu  | GET    | `/api/categories` | Danh mục 2 cấp |
| 1.2 | Home  | GET    | `/api/products/home/top` | Top 5 products |
| 1.3 | List  | GET    | `/api/products/category/:id` | Danh sách + phân trang |
| 1.4 | Search| GET    | `/api/products/search` | Full-text search (API nặng) |
| 1.5 | Detail| GET    | `/api/products/:id` | Chi tiết + related |

---

## Testing with cURL

```bash
# 1.1: Danh mục
curl "http://localhost:5001/api/categories"

# 1.2: Top products
curl "http://localhost:5001/api/products/home/top"

# 1.3: Danh sách theo danh mục
curl "http://localhost:5001/api/products/category/507f1f77bcf86cd799439011?page=1&limit=12&sortBy=newest"

# 1.4: Tìm kiếm
curl "http://localhost:5001/api/products/search?q=iPhone&sortBy=price_desc&page=1"

# 1.5: Chi tiết sản phẩm
curl "http://localhost:5001/api/products/507f1f77bcf86cd799439030"
```

---

## Error Handling

Tất cả APIs sử dụng custom AppError + global error handler:

```json
{
  "status": "error",
  "statusCode": 400,
  "code": "INVALID_SEARCH_QUERY",
  "message": "Vui lòng nhập từ khóa tìm kiếm (ít nhất 2 ký tự)",
  "timestamp": "2025-11-28T10:30:00Z"
}
```

---

## Files Created/Modified

### New Files:
- `backend/src/services/ProductService.js` - Business logic
- `backend/src/controllers/product.js` - HTTP handlers
- `backend/src/controllers/category.js` - HTTP handlers
- `backend/src/routes/product.js` - Routes
- `backend/src/routes/category.js` - Routes

### Modified Files:
- `backend/src/server.js` - Added category & product routes
- `backend/src/models/Product.js` - Added comments & indexes
- `backend/src/models/Category.js` - Added comments & indexes

---

## Architecture Diagram

```
Frontend Request (Browser/Mobile)
    ↓
Express Router (/api/categories, /api/products/...)
    ↓
Controller (product.js, category.js)
    ↓
Service Layer (ProductService, business logic)
    ↓
MongoDB Models + Aggregation Pipeline
    ↓
JSON Response
    ↓
Frontend
```

---

## Performance Optimization

1. **Indexes**: Đã thêm text index, categoryId, parentId
2. **Aggregation Pipeline**: Sử dụng $lookup, $match, $sort, $limit để optimize queries
3. **Pagination**: Hỗ trợ phân trang để giảm payload
4. **Lean Queries**: Sử dụng `.lean()` để trả về plain objects thay vì Mongoose documents
5. **Caching** (Future): Có thể thêm Redis caching cho top products

---

End of Documentation
*/

export default {};
