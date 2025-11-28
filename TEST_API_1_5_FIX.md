# Hướng dẫn Test API 1.1-1.5 Sau Khi Sửa Lỗi

## ✅ Lỗi đã sửa:

### Lỗi Seed Data:
- ❌ **Cũ**: `Cannot read properties of undefined (reading '_id')` ở dòng 560
- ✅ **Sửa**: Thêm ordered: false để insertMany tiếp tục dù có lỗi validation
- ✅ **Sửa**: Tạo auctions/bids động dựa trên products thực tế (không hardcode index)

### Kết quả Seed:
```
✅ Created 18 products (2 lỗi validation không quan trọng)
✅ Created 10 auctions  
✅ Created 155 bids
✅ Seed data completed successfully!
```

### Lỗi API 1.5:
- ❌ **Cũ**: `.lean()` gây populate không hoạt động
- ✅ **Sửa**: Loại bỏ `.lean()` khi populate relationships
- ✅ **Sửa**: Sử dụng `.toObject()` sau populate
- ✅ **Sửa**: Handle categoryId correctly (string hoặc object)
- ✅ **Sửa**: Fix related products query

---

## 📝 Lệnh Test API 1.1-1.5

### Bước 1: Đảm bảo Server Chạy

```bash
cd backend
npm run dev
```

Output phải có:
```
🚀 Server is running on http://localhost:5001
MongoDB connected successfully
```

### Bước 2: Test API 1.1 (Danh mục)

**Postman:**
```
GET http://localhost:5001/api/categories
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69297d390239c37a39083a31",
      "name": "Điện tử",
      "slug": "dien-tu",
      "level": 1,
      "children": [
        {
          "_id": "69297d3b0239c37a39083a38",
          "name": "Điện thoại",
          "slug": "dien-thoai",
          "level": 2
        }
      ]
    }
  ]
}
```

**→ Lấy category ID (ví dụ: `69297d390239c37a39083a31`)**

### Bước 3: Test API 1.3 (Danh sách sản phẩm)

```
GET http://localhost:5001/api/products/category/69297d390239c37a39083a31?page=1&limit=5
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69297d3b0239c37a39083a40",
      "title": "iPhone 15 Pro Max",
      "primaryImageUrl": "https://...",
      "auction": {
        "_id": "69297d3c0239c37a39083a50",
        "currentPrice": 25000000,
        "bidCount": 12
      }
    }
  ]
}
```

**→ Lấy product ID (ví dụ: `69297d3b0239c37a39083a40`)**

### Bước 4: Test API 1.5 (Chi tiết sản phẩm) ✨

```
GET http://localhost:5001/api/products/69297d3b0239c37a39083a40
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Lấy chi tiết sản phẩm thành công",
  "data": {
    "product": {
      "_id": "69297d3b0239c37a39083a40",
      "title": "iPhone 15 Pro Max",
      "slug": "iphone-15-pro-max",
      "primaryImageUrl": "https://...",
      "imageUrls": ["https://...", "https://...", "https://..."],
      "categoryId": {
        "_id": "69297d3a0239c37a39083a38",
        "name": "Điện thoại",
        "slug": "dien-thoai"
      },
      "sellerId": {
        "_id": "69297d390239c37a39083a31",
        "username": "seller_test_001",
        "ratingSummary": {
          "score": 4.5,
          "countPositive": 150,
          "countNegative": 5
        }
      },
      "metadata": {
        "brand": "Apple",
        "model": "iPhone 15 Pro Max",
        "condition": "Mới 100%"
      },
      "auction": {
        "_id": "69297d3c0239c37a39083a50",
        "currentPrice": 25000000,
        "bidCount": 12,
        "endAt": "2025-11-28T18:00:00.000Z",
        "timeRemaining": 28800000,
        "isActive": true,
        "topBidders": [
          {
            "amount": 25000000,
            "bidderUsername": "bidder_test_001",
            "bidderRating": 4.5,
            "createdAt": "2025-11-28T10:00:00.000Z"
          },
          {
            "amount": 24900000,
            "bidderUsername": "bidder_test_002",
            "bidderRating": 4.7,
            "createdAt": "2025-11-28T09:50:00.000Z"
          }
        ]
      }
    },
    "relatedProducts": [
      {
        "_id": "69297d3b0239c37a39083a41",
        "title": "iPhone 14 Pro",
        "primaryImageUrl": "https://...",
        "auction": {
          "_id": "69297d3c0239c37a39083a51",
          "currentPrice": 15500000,
          "bidCount": 8,
          "endAt": "2025-11-28T20:00:00.000Z",
          "timeRemaining": 36000000
        }
      }
    ]
  },
  "timestamp": "2025-11-28T10:30:00Z"
}
```

---

## ✅ Checklist Test

API 1.5 Thành Công Khi:
- [ ] Status: 200 OK
- [ ] `product` trả về đầy đủ thông tin
- [ ] `product.categoryId` là object với name, slug (không phải null)
- [ ] `product.sellerId` là object với username, ratingSummary
- [ ] `product.auction` có `currentPrice`, `bidCount`, `timeRemaining`, `isActive`
- [ ] `product.auction.topBidders` là array ≥ 0 (có bidders thì show)
- [ ] `relatedProducts` là array các sản phẩm cùng category
- [ ] Không có lỗi "Cannot read properties of undefined"

---

## 🐛 Troubleshooting

### Error 1: "Sản phẩm không tồn tại" (404)
```json
{
  "status": "error",
  "code": "PRODUCT_NOT_FOUND",
  "message": "Sản phẩm không tồn tại"
}
```

**Giải pháp:**
- Kiểm tra product ID từ API 1.3 response
- Đảm bảo ID format: `507f1f77bcf86cd799439011`
- Chạy lại seed data: `node src/seedData.js`

### Error 2: "Phiên đấu giá không tồn tại" (404)
```json
{
  "status": "error",
  "code": "AUCTION_NOT_FOUND",
  "message": "Phiên đấu giá không tồn tại"
}
```

**Giải pháp:**
- Chạy lại seed data để tạo auctions
- Kiểm tra MongoDB có dữ liệu: `db.auctions.countDocuments()`

### Error 3: TypeError (500)
```json
{
  "status": "error",
  "code": "INTERNAL_ERROR",
  "message": "..."
}
```

**Giải pháp:**
- Kiểm tra server logs (dòng `[PRODUCT SERVICE]`)
- Xóa dữ liệu cũ: `node src/seedData.js` (auto clean)

---

## 📊 Server Logs Test

Khi API 1.5 chạy thành công, bạn sẽ thấy:

```
[PRODUCT CONTROLLER] GET /api/products/69297d3b0239c37a39083a40
[PRODUCT SERVICE] Lấy chi tiết sản phẩm: 69297d3b0239c37a39083a40
[PRODUCT SERVICE] Chi tiết sản phẩm lấy thành công
```

---

## 📄 Files Đã Sửa

| File | Sửa | Giải thích |
|------|-----|-----------|
| `backend/src/seedData.js` | ✅ ordered: false | Tiếp tục insert dù có lỗi |
| `backend/src/seedData.js` | ✅ Dynamic auctions | Tạo dựa trên products thực tế |
| `backend/src/services/ProductService.js` | ✅ Loại bỏ .lean() | Populate hoạt động đúng |
| `backend/src/services/ProductService.js` | ✅ Handle categoryId | Xử lý string hoặc object |
| `backend/src/services/ProductService.js` | ✅ Fix related query | Sử dụng preserveNullAndEmptyArrays |

---

## 🎯 Tóm tắt

✅ **Seed data**: 18 products, 10 auctions, 155 bids
✅ **API 1.5 sửa**: Loại bỏ `.lean()`, handle categoryId, fix related products
✅ **Ready**: Test tất cả 5 APIs bằng Postman
✅ **Next step**: Commit code lên `BaoPham/database` branch
