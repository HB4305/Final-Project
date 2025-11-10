src/
├── assets/                  # Tài nguyên tĩnh: hình ảnh, font, icon...
│   ├── images/
│   ├── fonts/
│   └── styles/              # CSS/SCSS toàn cục (index.css, main.scss)
├── components/              # Các Component UI có thể tái sử dụng
│   ├── common/              # Các UI cơ bản: Button, Input, Modal, Form/reCaptcha
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Modal.jsx
│   ├── layout/              # Cấu trúc trang (Header, Footer, Navigation)
│   │   ├── Header.jsx       # Chứa Menu & Danh mục 2 cấp
│   │   ├── Footer.jsx
│   │   └── AuthLayout.jsx   # Layout riêng cho Login/Register
│   └── product/             # Các Component liên quan đến Sản phẩm
│       ├── ProductCard.jsx  # Hiển thị sản phẩm trong danh sách
│       ├── BidHistory.jsx   # Lịch sử ra giá
│       ├── ProductImages.jsx
│       └── Timer.jsx        # Component đếm ngược thời gian còn lại
├── contexts/                # Quản lý State toàn cục (Authentication, System Config)
│   ├── AuthContext.jsx      # Chứa logic đăng nhập, đăng xuất, thông tin user
│   └── ConfigContext.jsx    # Lưu các tham số cấu hình: 5 phút gia hạn, 10 phút gia hạn
├── hooks/                   # Các Custom Hook tái sử dụng
│   ├── useAuth.js
│   ├── useApi.js            # Hook xử lý việc gọi API
│   ├── useBidTimer.js       # Logic tính toán thời gian còn lại (relative time)
│   └── useFullTextSearch.js
├── pages/                   # Các View (Trang) chính của ứng dụng - Phân chia theo Phân hệ
│   ├── Guest/               # Phân hệ 1: Người dùng nặc danh
│   │   ├── HomePage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── SearchPage.jsx
│   │   └── ProductDetailPage.jsx
│   ├── Auth/                # Đăng ký / Đăng nhập
│   │   ├── Login.jsx
│   │   └── Register.jsx     # Xử lý OTP, reCaptcha
│   ├── Bidder/              # Phân hệ 2: Người mua đã đăng nhập
│   │   ├── WatchListPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── CompleteOrderPage.jsx # Quy trình Thanh toán
│   ├── Seller/              # Phân hệ 3: Người bán
│   │   ├── SellerDashboard.jsx
│   │   ├── ProductForm.jsx  # Đăng/Sửa sản phẩm (sử dụng QuillJS/TinyMCE)
│   │   └── SellerOrders.jsx # Quản lý đơn hàng đã thắng
│   └── Admin/               # Phân hệ 4: Quản trị viên
│       ├── AdminDashboard.jsx
│       ├── UserManagement.jsx
│       └── CategoryManagement.jsx
├── services/                # Logic gọi API (Kết nối với Backend RESTful API)
│   ├── authService.js
│   ├── productService.js
│   ├── bidService.js
│   └── adminService.js
├── utils/                   # Các hàm tiện ích
│   ├── formatter.js         # Định dạng tiền tệ, ngày tháng
│   └── validator.js         # Kiểm tra tính hợp lệ của dữ liệu
├── App.jsx                  # Component gốc, nơi chứa Router
└── main.jsx                 # Entry point của ứng dụng