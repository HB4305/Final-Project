# AuctionHub - React + Vite + Tailwind CSS

Một ứng dụng đấu giá trực tuyến hiện đại được xây dựng với React, Vite và Tailwind CSS.

## 🚀 Cài đặt và Chạy Project

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Chạy development server
```bash
npm run dev
```

Ứng dụng sẽ tự động mở tại `http://localhost:3000`

### Bước 3: Build cho production
```bash
npm run build
```

### Bước 4: Preview production build
```bash
npm run preview
```

## 📦 Công nghệ sử dụng

- **React 18** - Thư viện UI
- **Vite** - Build tool nhanh và hiện đại
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📁 Cấu trúc thư mục

```
code (1)/
├── src/
│   ├── App.jsx          # Main app component với routing
│   └── main.jsx         # Entry point
├── app/
│   ├── page.jsx         # Home page
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── products/        # Products listing
│   ├── product/[id]/    # Product detail
│   ├── dashboard/       # User dashboard
│   └── profile/         # User profile
├── components/
│   ├── navigation.jsx
│   ├── featured-products.jsx
│   └── category-nav.jsx
├── public/              # Static assets
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## ✨ Tính năng

- 🏠 Trang chủ với sản phẩm nổi bật
- 🔐 Authentication (Login/Signup)
- 🛍️ Danh sách sản phẩm với filter & search
- 📱 Responsive design
- 🎨 Modern UI với Tailwind CSS
- ⚡ Fast development với Vite

## 🛠️ Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 📝 Lưu ý

Project này đã được chuyển đổi từ Next.js sang React + Vite. Tất cả các tính năng Next.js-specific như:
- `'use client'` directives đã được loại bỏ
- `next/link` → `react-router-dom`
- `next/navigation` → `react-router-dom`
- Next.js routing → React Router

đã được thay thế bằng các giải pháp tương đương trong React Router.
