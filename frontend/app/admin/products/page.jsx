import React, { useState, useEffect } from "react";
import { Trash2, Eye, RefreshCw, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AdminNavigation from "../../../components/admin-navigation";
import productService from "../../services/productService";
import { getProductAdminDetails } from "../../services/productService";
import Toast from "../../../components/Toast";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Lấy tất cả sản phẩm với mọi trạng thái (không filter theo status)
      const response = await productService.getAllProducts({});
      console.log(response.data);
      if (response.success) {
        setProducts(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (product) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${product.title}"?`)) return;

    try {
      const response = await productService.deleteProduct(product._id);

      if (response.success) {
        setToast({
          message: response.message || "Xóa sản phẩm thành công",
          type: "success",
        });
        fetchProducts();
      } else {
        setToast({ message: "Lỗi: " + response.message, type: "error" });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setToast({ message: "Đã xảy ra lỗi. Vui lòng thử lại.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-32">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý Sản phẩm
              </h1>
              <p className="text-gray-600 mt-1">
                Xem và xóa các danh sách đấu giá
              </p>
            </div>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Làm mới
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg animate-pulse shadow-lg"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 mb-2">Đang tải sản phẩm</p>
                <p className="text-sm text-gray-500">Đang lấy dữ liệu từ hệ thống...</p>
                <div className="flex gap-1 justify-center mt-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá hiện tại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr 
                      key={product._id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={async () => {
                        setShowDetailModal(true);
                        setLoadingDetails(true);
                        const response = await getProductAdminDetails(product._id);
                        if (response.success) {
                          setSelectedProduct(response.data);
                        } else {
                          setToast({ message: "Không thể tải chi tiết sản phẩm", type: "error" });
                          setShowDetailModal(false);
                        }
                        setLoadingDetails(false);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.primaryImageUrl || "/placeholder.svg"}
                            alt={product.title}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {product.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {typeof product.category === "object"
                                ? product.category?.name
                                : product.category}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {product.auction.bidCount} lượt đặt
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-lg font-bold text-gray-900">
                          ${(
                            product.auction.currentPrice ||
                            product.auction.currentBid ||
                            0
                          ).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                          product.auction.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : product.auction.status === 'ended'
                            ? 'bg-blue-100 text-blue-800'
                            : product.auction.status === 'scheduled'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.auction.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/product/${product._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={(e) => e.stopPropagation()}
                          title="Xem trên trang"
                        >
                          <Eye className="w-5 h-5 inline" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {products.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Không tìm thấy sản phẩm nào.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Chi tiết sản phẩm (Admin)</h2>
                  <p className="text-blue-100">Thông tin đầy đủ về sản phẩm và phiên đấu giá</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {loadingDetails ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedProduct ? (
              <div className="p-6 space-y-6">
                {/* Product Image & Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex justify-center">
                    <img
                      src={selectedProduct.product?.primaryImageUrl || "/placeholder.svg"}
                      alt={selectedProduct.product?.title}
                      className="max-h-64 rounded-xl shadow-lg object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tên sản phẩm</label>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedProduct.product?.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Danh mục</label>
                      <p className="text-gray-900 mt-1">{selectedProduct.product?.categoryId?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Người bán</label>
                      <p className="text-gray-900 mt-1">{selectedProduct.product?.sellerId?.username}</p>
                      <p className="text-xs text-gray-500">{selectedProduct.product?.sellerId?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Auction Stats */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê đấu giá</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-blue-200">
                      <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Giá hiện tại</label>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        ${(selectedProduct.auction?.currentPrice || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-green-200">
                      <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Tổng số bid</label>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {selectedProduct.stats?.totalBids || 0}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-purple-200">
                      <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Người đặt</label>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {selectedProduct.stats?.uniqueBidders || 0}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Trạng thái</label>
                      <p className="text-lg font-bold text-orange-900 mt-1">
                        {selectedProduct.auction?.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auction Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Giá khởi điểm</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">${(selectedProduct.auction?.startPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bước giá</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">${(selectedProduct.auction?.priceStep || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Giá mua ngay</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {selectedProduct.auction?.buyNowPrice 
                        ? `$${selectedProduct.auction.buyNowPrice.toLocaleString()}` 
                        : 'Không có'}
                    </p>
                  </div>
                </div>

                {/* Auto Extend Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tự động gia hạn</label>
                    <p className={`text-lg font-bold mt-1 ${selectedProduct.auction?.autoExtendEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProduct.auction?.autoExtendEnabled ? 'Bật' : 'Tắt'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Số lần gia hạn</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">{selectedProduct.auction?.autoExtendCount || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cửa sổ gia hạn</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">{selectedProduct.auction?.autoExtendWindowSec || 0}s</p>
                  </div>
                </div>

                {/* Time Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thời gian bắt đầu</label>
                    <p className="text-gray-900 mt-1">{selectedProduct.auction?.startAt ? new Date(selectedProduct.auction.startAt).toLocaleString('vi-VN') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thời gian kết thúc</label>
                    <p className="text-gray-900 mt-1">{selectedProduct.auction?.endAt ? new Date(selectedProduct.auction.endAt).toLocaleString('vi-VN') : 'N/A'}</p>
                  </div>
                </div>

                {/* Current Highest Bidder */}
                {selectedProduct.auction?.currentHighestBidder && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <label className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Người đặt giá cao nhất</label>
                    <p className="text-lg font-bold text-yellow-900 mt-1">
                      {selectedProduct.auction.currentHighestBidder.username}
                    </p>
                    <p className="text-xs text-yellow-600">{selectedProduct.auction.currentHighestBidder.email}</p>
                  </div>
                )}

                {/* Recent Bids */}
                {selectedProduct.bids && selectedProduct.bids.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch sử đặt giá (5 gần nhất)</h3>
                    <div className="bg-gray-50 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người đặt</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedProduct.bids.slice(0, 5).map((bid, idx) => (
                            <tr key={idx} className={idx === 0 ? 'bg-green-50' : ''}>
                              <td className="px-4 py-3 text-sm">
                                <div>
                                  <p className="font-medium text-gray-900">{bid.bidder?.username}</p>
                                  <p className="text-xs text-gray-500">{bid.bidder?.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                ${bid.amount?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(bid.createdAt).toLocaleString('vi-VN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* IDs */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Product ID</label>
                    <p className="text-xs text-gray-600 mt-1 font-mono break-all">{selectedProduct.product?._id}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Auction ID</label>
                    <p className="text-xs text-gray-600 mt-1 font-mono break-all">{selectedProduct.auction?._id}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Đóng
              </button>
              {selectedProduct?.product?._id && (
                <Link
                  to={`/product/${selectedProduct.product._id}`}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Xem trên trang
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
