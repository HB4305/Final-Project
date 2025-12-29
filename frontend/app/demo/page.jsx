"use client";

import React, { useState } from 'react';
import { Package, Settings, UserX, LogOut } from 'lucide-react';
import UpdateProductDescription from '../../components/update-product-description';
import RejectBidder from '../../components/reject-bidder';
import WithdrawBid from '../../components/withdraw-bid';

/**
 * Demo Page - Testing UI Components for API 3.2 & 3.3
 * Trang demo để test các tính năng mới
 */
export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('description');

  // Mock data
  const mockProduct = {
    _id: '6765a1b2c3d4e5f6g7h8i9j0',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'iPhone mới 100%, nguyên seal, bảo hành 12 tháng chính hãng Apple.',
    metadata: {
      condition: 'new',
      warranty: '12 months',
      tags: ['iphone', 'apple', 'flagship']
    },
    currentPrice: 27000000
  };

  const mockBidder = {
    _id: '6765b2c3d4e5f6g7h8i9j0k1',
    username: 'buyer123',
    name: 'Nguyễn Văn A',
    currentBid: 27000000,
    bidCount: 5
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Demo UI Components - API 3.2 & 3.3
          </h1>
          <p className="text-gray-600">
            Test các tính năng: Cập nhật mô tả sản phẩm, Từ chối bidder, Rút giá
          </p>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Sản phẩm Demo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tên sản phẩm</p>
              <p className="font-medium text-gray-900">{mockProduct.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Giá hiện tại</p>
              <p className="font-medium text-gray-900">
                {mockProduct.currentPrice.toLocaleString('vi-VN')} VND
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Product ID</p>
              <p className="font-mono text-xs text-gray-600">{mockProduct._id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tình trạng</p>
              <p className="font-medium text-green-600">Đang đấu giá</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('description')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'description'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                API 3.2: Cập nhật mô tả
              </button>
              <button
                onClick={() => setActiveTab('reject')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'reject'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <UserX className="w-4 h-4" />
                API 3.3a: Từ chối bidder
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'withdraw'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <LogOut className="w-4 h-4" />
                API 3.3b: Rút giá
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Content: Update Description */}
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    📝 Mô tả tính năng
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Seller có thể cập nhật mô tả chi tiết hơn sau khi đăng sản phẩm</li>
                    <li>Lưu lịch sử thay đổi mô tả (ai sửa, sửa gì, khi nào)</li>
                    <li>Cập nhật metadata (tình trạng, bảo hành, tags...)</li>
                    <li>Không cho phép edit khi auction đã kết thúc</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-3 font-mono">
                    PUT /api/products/:productId/description
                  </p>
                </div>

                <UpdateProductDescription
                  productId={mockProduct._id}
                  currentDescription={mockProduct.description}
                  currentMetadata={mockProduct.metadata}
                  onUpdate={(updatedProduct) => {
                    console.log('Product updated:', updatedProduct);
                    alert('✅ Component callback: Product đã được cập nhật!');
                  }}
                />
              </div>
            )}

            {/* Tab Content: Reject Bidder */}
            {activeTab === 'reject' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">
                    🚫 Mô tả tính năng
                  </h3>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Seller có thể từ chối bidder có lịch sử giao dịch xấu</li>
                    <li>Vô hiệu hóa tất cả bids và auto-bids của bidder</li>
                    <li>Tự động chuyển người thắng sang bidder thứ 2 (nếu cần)</li>
                    <li>Thêm vào blacklist, không cho bidder này đặt giá lại</li>
                  </ul>
                  <p className="text-xs text-red-700 mt-3 font-mono">
                    POST /api/products/:productId/reject-bidder
                  </p>
                </div>

                {/* Bidder Card */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Bidder đang thắng</p>
                      <p className="font-semibold text-gray-900">{mockBidder.username}</p>
                      <p className="text-xs text-gray-500">{mockBidder.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Giá hiện tại</p>
                      <p className="text-xl font-bold text-blue-600">
                        {mockBidder.currentBid.toLocaleString('vi-VN')} VND
                      </p>
                      <p className="text-xs text-gray-500">{mockBidder.bidCount} lượt đặt</p>
                    </div>
                  </div>

                  <RejectBidder
                    productId={mockProduct._id}
                    bidder={mockBidder}
                    onReject={(result) => {
                      console.log('Bidder rejected:', result);
                      alert('✅ Component callback: Bidder đã bị từ chối!');
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tab Content: Withdraw Bid */}
            {activeTab === 'withdraw' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    🔙 Mô tả tính năng
                  </h3>
                  <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                    <li>Bidder có thể tự rút lại tất cả giá đã đặt</li>
                    <li>Lý do rút giá là không bắt buộc (optional)</li>
                    <li>Tự động chuyển người thắng sang bidder thứ 2 (nếu đang thắng)</li>
                    <li>Không thể hoàn tác sau khi rút</li>
                  </ul>
                  <p className="text-xs text-orange-700 mt-3 font-mono">
                    POST /api/products/:productId/withdraw-bid
                  </p>
                </div>

                {/* Your Bid Card */}
                <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Giá bạn đang đặt</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-blue-600">
                        {mockProduct.currentPrice.toLocaleString('vi-VN')}
                      </p>
                      <p className="text-gray-600">VND</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Bạn đang là <strong className="text-green-600">người thắng</strong> hiện tại
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Thông tin phiên đấu giá</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tổng lượt đặt của bạn</p>
                        <p className="font-semibold text-gray-900">5 lượt</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Auto-bid</p>
                        <p className="font-semibold text-green-600">Đang bật</p>
                      </div>
                    </div>
                  </div>

                  <WithdrawBid
                    productId={mockProduct._id}
                    currentBid={mockProduct.currentPrice}
                    onWithdraw={(result) => {
                      console.log('Bid withdrawn:', result);
                      alert('✅ Component callback: Đã rút giá thành công!');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            💡 Lưu ý khi test
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>
              <strong>Backend phải đang chạy:</strong> <code className="bg-yellow-100 px-2 py-1 rounded">npm run dev</code> trong folder backend
            </li>
            <li>
              <strong>Cần login:</strong> Các API yêu cầu authentication token (Bearer Token)
            </li>
            <li>
              <strong>Mock data:</strong> Trang này sử dụng dữ liệu giả để demo UI. Khi test thật cần dùng productId thật từ database
            </li>
            <li>
              <strong>Console logs:</strong> Mở DevTools (F12) để xem request/response từ API
            </li>
            <li>
              <strong>Postman Testing:</strong> Xem file <code className="bg-yellow-100 px-2 py-1 rounded">API_TESTING_GUIDE_3.2_3.3.md</code> để test API chi tiết
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
