# API Documentation - Upgrade Requests System

## Overview
Complete implementation of bidder-to-seller upgrade request system with 7-day seller role expiration.

---

## API 2.6: Bidder Submit Upgrade Request

### Endpoint
```
POST /api/users/upgrade-request
```

### Authentication
- Required: Yes (JWT Token)
- Role: Bidder (or anyone without valid seller role)

### Request Body
```json
{
  "reason": "I want to sell vintage items. I have experience in auctions and good reputation."
}
```

### Validation Rules
- `reason`: Required, string, max 500 characters
- User must NOT have valid seller role (or expired seller role)
- User must NOT have pending upgrade request

### Response Success (201)
```json
{
  "success": true,
  "message": "Yêu cầu nâng cấp đã được gửi thành công",
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "status": "pending",
    "requestedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

**400 - Missing Reason**
```json
{
  "success": false,
  "message": "Lý do yêu cầu là bắt buộc"
}
```

**400 - Already Seller**
```json
{
  "success": false,
  "message": "Bạn đã có quyền seller"
}
```

**400 - Pending Request Exists**
```json
{
  "success": false,
  "message": "Bạn đã có yêu cầu nâng cấp đang chờ xét duyệt"
}
```

### Business Logic
1. Validate reason field (required, max 500 chars)
2. Check if user already has valid seller role
3. Check sellerExpiresAt - if expired, allow new request
4. Check for existing pending requests
5. Create UpgradeRequest with status='pending'
6. Return requestId for tracking

---

## API 4.3: Admin Review Upgrade Requests

### 4.3.1: List All Upgrade Requests

#### Endpoint
```
GET /api/admin/upgrade-requests?status=pending&page=1&limit=20
```

#### Authentication
- Required: Yes (JWT Token)
- Role: Admin

#### Query Parameters
| Parameter | Type   | Default | Description                                    |
|-----------|--------|---------|------------------------------------------------|
| status    | string | all     | Filter by status: pending, approved, rejected  |
| page      | number | 1       | Page number                                    |
| limit     | number | 20      | Items per page                                 |

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "user": {
          "_id": "507f1f77bcf86cd799439012",
          "email": "bidder@example.com",
          "fullName": "John Doe",
          "roles": ["bidder"]
        },
        "reason": "I want to sell vintage items...",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "reviewedBy": null,
        "reviewedAt": null,
        "reviewNote": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 4.3.2: Get Upgrade Request Detail

#### Endpoint
```
GET /api/admin/upgrade-requests/:id
```

#### Authentication
- Required: Yes (JWT Token)
- Role: Admin

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "bidder@example.com",
      "fullName": "John Doe",
      "roles": ["bidder"],
      "createdAt": "2023-12-01T00:00:00.000Z"
    },
    "reason": "I want to sell vintage items. I have experience in auctions and good reputation.",
    "documents": [],
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "reviewedBy": null,
    "reviewedAt": null,
    "reviewNote": null
  }
}
```

#### Error Responses

**404 - Not Found**
```json
{
  "success": false,
  "message": "Yêu cầu nâng cấp không tồn tại"
}
```

---

### 4.3.3: Approve Upgrade Request

#### Endpoint
```
PUT /api/admin/upgrade-requests/:id/approve
```

#### Authentication
- Required: Yes (JWT Token)
- Role: Admin

#### Request Body
```json
{
  "reviewNote": "Approved based on good reputation and valid reason."
}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Yêu cầu nâng cấp đã được phê duyệt",
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "status": "approved",
    "sellerExpiresAt": "2024-01-22T10:30:00.000Z",
    "reviewedBy": "507f1f77bcf86cd799439013",
    "reviewedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Business Logic
1. Validate request exists and status is 'pending'
2. Add 'seller' to user.roles if not already present
3. Set user.sellerExpiresAt = now + 7 days
4. Update request: status='approved', reviewedBy, reviewedAt, reviewNote
5. Create audit log: UPGRADE_REQUEST_APPROVED
6. Return updated request with seller expiration date

#### Error Responses

**400 - Not Pending**
```json
{
  "success": false,
  "message": "Chỉ có thể phê duyệt yêu cầu đang chờ xét duyệt"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Yêu cầu nâng cấp không tồn tại"
}
```

---

### 4.3.4: Reject Upgrade Request

#### Endpoint
```
PUT /api/admin/upgrade-requests/:id/reject
```

#### Authentication
- Required: Yes (JWT Token)
- Role: Admin

#### Request Body
```json
{
  "reviewNote": "Reason not sufficient. Please provide more details about your selling experience."
}
```

#### Validation Rules
- `reviewNote`: Required, string, max 500 characters

#### Response Success (200)
```json
{
  "success": true,
  "message": "Yêu cầu nâng cấp đã bị từ chối",
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "status": "rejected",
    "reviewedBy": "507f1f77bcf86cd799439013",
    "reviewedAt": "2024-01-15T11:00:00.000Z",
    "reviewNote": "Reason not sufficient..."
  }
}
```

#### Business Logic
1. Validate reviewNote is required
2. Validate request exists and status is 'pending'
3. Update request: status='rejected', reviewedBy, reviewedAt, reviewNote
4. Create audit log: UPGRADE_REQUEST_REJECTED
5. Return updated request

#### Error Responses

**400 - Missing Review Note**
```json
{
  "success": false,
  "message": "Ghi chú xét duyệt là bắt buộc khi từ chối"
}
```

**400 - Not Pending**
```json
{
  "success": false,
  "message": "Chỉ có thể từ chối yêu cầu đang chờ xét duyệt"
}
```

---

## Seller Role Expiration System

### How It Works
1. **Initial State**: User has role 'bidder' only
2. **Submit Request**: Bidder submits upgrade request via API 2.6
3. **Admin Review**: Admin approves request via API 4.3.3
4. **Grant Role**: System adds 'seller' to user.roles and sets sellerExpiresAt = now + 7 days
5. **Active Period**: User can post products and manage auctions for 7 days
6. **Expiration**: After 7 days, seller cannot post new products (existing products remain manageable)
7. **Renewal**: Expired sellers can submit new upgrade request

### Seller Expiration Check Middleware

#### Location
`backend/src/middlewares/roles.js` - `checkSellerExpiration()`

#### Applied To
- POST /api/products (posting new products)
- Any other endpoints requiring valid seller role

#### Logic
```javascript
// Admin bypass expiration check
if (user.roles.includes('admin')) {
  return next();
}

// Check seller role exists
if (!user.roles.includes('seller')) {
  return error('Bạn cần quyền seller');
}

// Check expiration
if (user.sellerExpiresAt && new Date(user.sellerExpiresAt) < new Date()) {
  return error('Quyền seller của bạn đã hết hạn. Vui lòng yêu cầu gia hạn.');
}
```

#### Response When Expired (403)
```json
{
  "success": false,
  "message": "Quyền seller của bạn đã hết hạn. Vui lòng yêu cầu gia hạn."
}
```

---

## Database Models

### UpgradeRequest Schema
```javascript
{
  user: ObjectId,              // Reference to User
  reason: String,              // Required, max 500 chars
  documents: [String],         // Optional file URLs
  status: String,              // enum: ['pending', 'approved', 'rejected']
  reviewedBy: ObjectId,        // Reference to Admin user
  reviewedAt: Date,            // Timestamp of review
  reviewNote: String,          // Admin's review comment, max 500 chars
  createdAt: Date,             // Auto-generated
  updatedAt: Date              // Auto-generated
}

// Indexes
{ user: 1, status: 1 }        // Find user's requests by status
{ status: 1, createdAt: -1 }  // List pending requests, newest first
```

### User Schema Addition
```javascript
{
  // ... existing fields
  sellerExpiresAt: Date        // Timestamp when seller role expires
}
```

---

## Testing Scenarios

### Scenario 1: Bidder Request Upgrade
```bash
# 1. Login as bidder
POST /api/auth/login
Body: { "email": "bidder@example.com", "password": "password123" }

# 2. Submit upgrade request
POST /api/users/upgrade-request
Headers: { "Authorization": "Bearer <token>" }
Body: { "reason": "I want to sell collectible items" }

# Expected: 201 with requestId and status='pending'
```

### Scenario 2: Admin Approve Request
```bash
# 1. Login as admin
POST /api/auth/login
Body: { "email": "admin@example.com", "password": "admin123" }

# 2. List pending requests
GET /api/admin/upgrade-requests?status=pending
Headers: { "Authorization": "Bearer <admin_token>" }

# 3. Approve specific request
PUT /api/admin/upgrade-requests/<requestId>/approve
Headers: { "Authorization": "Bearer <admin_token>" }
Body: { "reviewNote": "Approved" }

# Expected: 200 with sellerExpiresAt = now + 7 days
```

### Scenario 3: Expired Seller Attempt Post
```bash
# 1. Wait 7 days after approval (or manually set sellerExpiresAt to past date)

# 2. Try to post product
POST /api/products
Headers: { "Authorization": "Bearer <seller_token>" }
Body: { product data }

# Expected: 403 "Quyền seller của bạn đã hết hạn"
```

### Scenario 4: Renewal Request
```bash
# 1. Expired seller submits new request
POST /api/users/upgrade-request
Headers: { "Authorization": "Bearer <expired_seller_token>" }
Body: { "reason": "Request renewal for continued selling" }

# Expected: 201 - System allows new request since seller role expired
```

---

## Integration Points

### With Existing Systems

#### Product Posting
- **Before**: Only checked if user has 'seller' role
- **After**: Checks seller role AND sellerExpiresAt < now
- **Route**: POST /api/products
- **Middleware**: authenticate → checkSellerExpiration → postProduct

#### User Management
- **User Model**: Added sellerExpiresAt field
- **Admin Panel**: Should display seller expiration date
- **Profile Page**: Seller should see expiration warning

#### Audit Logging
- New action types:
  - `UPGRADE_REQUEST_APPROVED`
  - `UPGRADE_REQUEST_REJECTED`
- Logged by admin ID with request details

---

## Error Handling

### Common Errors

| Status | Code                        | Message                                           |
|--------|-----------------------------|---------------------------------------------------|
| 400    | VALIDATION_ERROR            | Lý do yêu cầu là bắt buộc                         |
| 400    | ALREADY_HAS_ROLE            | Bạn đã có quyền seller                            |
| 400    | DUPLICATE_REQUEST           | Bạn đã có yêu cầu nâng cấp đang chờ xét duyệt    |
| 400    | INVALID_STATUS              | Chỉ có thể phê duyệt yêu cầu đang chờ xét duyệt  |
| 403    | SELLER_EXPIRED              | Quyền seller của bạn đã hết hạn                   |
| 404    | NOT_FOUND                   | Yêu cầu nâng cấp không tồn tại                    |

---

## Frontend Implementation Notes

### Bidder View
1. **Submit Request Button**: Show if user is bidder or expired seller
2. **Request Status**: Display pending/approved/rejected status
3. **Expiration Warning**: Show countdown if seller role near expiration

### Admin Panel
1. **Pending Requests Tab**: List all pending requests with pagination
2. **Request Detail Modal**: Show user info, reason, documents
3. **Approve/Reject Actions**: With review note text area
4. **Request History**: Filter by status and date

### Notification System
1. **On Submit**: "Your upgrade request has been submitted"
2. **On Approve**: "Your seller account has been activated for 7 days"
3. **On Reject**: "Your upgrade request was rejected: {reviewNote}"
4. **On Expiration**: "Your seller privileges will expire in 1 day"

---

## Security Considerations

1. **Authentication**: All endpoints require JWT token
2. **Authorization**: Admin-only for review endpoints
3. **Rate Limiting**: Prevent spam upgrade requests (1 request per 24 hours)
4. **Input Validation**: Max 500 chars for reason and reviewNote
5. **SQL Injection**: Mongoose handles query sanitization
6. **XSS Prevention**: Frontend should sanitize displayed text

---

## Performance Optimization

1. **Indexes**: 
   - `{ user: 1, status: 1 }` for fast user request lookup
   - `{ status: 1, createdAt: -1 }` for admin pending list
2. **Pagination**: Default 20 items per page
3. **Populate**: Only load necessary user fields (email, fullName, roles)
4. **Caching**: Consider caching pending count for admin dashboard

---

## Future Enhancements

1. **Document Upload**: Support for identity documents
2. **Auto-Renewal**: Option to auto-renew seller role
3. **Email Notifications**: Send email on approve/reject
4. **Seller History**: Track total sales, ratings before approval
5. **Tiered Sellers**: Bronze/Silver/Gold seller levels
6. **Seller Analytics**: Track performance during 7-day period

---

## Maintenance

### Cleanup Tasks
- Archive old requests (approved/rejected > 90 days)
- Send reminders to sellers 1 day before expiration
- Auto-remove seller role when expired (optional)

### Monitoring
- Track approval rate
- Average review time
- Expired sellers requesting renewal

---

## Contact
For API support or questions:
- Backend Team: backend@example.com
- Documentation: /docs/api
