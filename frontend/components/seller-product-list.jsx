import React, { useState } from 'react';
import { Package, Edit, Trash2, X, CheckCircle, Clock, Plus, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * SellerProductList Component
 * Displays seller's products with management options (section 3.5)
 * - View active listings
 * - Edit product descriptions
 * - View products with winners
 */
export default function SellerProductList({ products = [], onEdit, onDelete }) {
  const [filter, setFilter] = useState('active'); // active, ended, all

  const filteredProducts = products.filter(p => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'ended') return p.status === 'ended';
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Đang diễn ra</span>,
      ended: <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Đã kết thúc</span>,
      pending: <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Chờ duyệt</span>
    };
    return badges[status] || null;
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'active' 
                ? 'bg-primary text-white' 
                : 'bg-background border border-border hover:bg-muted'
            }`}
          >
            Đang diễn ra
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'ended' 
                ? 'bg-primary text-white' 
                : 'bg-background border border-border hover:bg-muted'
            }`}
          >
            Đã kết thúc
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-background border border-border hover:bg-muted'
            }`}
          >
            Tất cả
          </button>
        </div>
        <Link
          to="/seller/new-listing"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Đăng bán mới
        </Link>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-background border border-border rounded-lg">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Không tìm thấy sản phẩm</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <img
                  src={product.image || '/placeholder.svg'}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />

                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link 
                        to={`/product/${product.id}`}
                        className="font-semibold text-lg hover:text-primary transition"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    {getStatusBadge(product.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Giá hiện tại</p>
                      <p className="font-bold text-primary">${product.currentBid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lượt đấu giá</p>
                      <p className="font-semibold">{product.totalBids}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Thời gian còn lại</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {product.timeLeft || 'Đã kết thúc'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Giá khởi điểm</p>
                      <p className="font-semibold">${product.startingBid.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Winner Info (if ended) */}
                  {product.status === 'ended' && product.winner && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          Người thắng: {product.winner.name}
                        </span>
                        <span className="text-green-700">
                          ${product.winner.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/seller/products/${product.id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </Link>
                    <Link
                      to={`/seller/products/${product.id}/bids`}
                      className="flex items-center gap-1 px-3 py-1.5 border border-border rounded hover:bg-muted transition text-sm font-medium"
                    >
                      Xem đấu giá
                    </Link>
                    {product.status === 'ended' && product.winner && (
                      <Link
                        to={`/seller/orders/${product.orderId}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
                      >
                        Quản lý đơn hàng
                      </Link>
                    )}
                    <button
                      onClick={() => onDelete && onDelete(product.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
