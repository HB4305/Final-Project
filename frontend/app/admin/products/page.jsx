import React, { useState, useEffect } from "react";
import { Loader, Trash2, Eye, RefreshCw, X, AlertTriangle } from "lucide-react";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await productService.deleteProduct(productToDelete._id);

      if (response.success) {
        setToast({
          message: response.message || "Xóa sản phẩm thành công",
          type: "success",
        });
        fetchProducts();
        setShowDeleteModal(false);
        setProductToDelete(null);
      } else {
        setToast({ message: "Lỗi: " + response.message, type: "error" });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setToast({ message: "Đã xảy ra lỗi. Vui lòng thử lại.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavigation />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="font-semibold">Sản phẩm đang đấu giá</h2>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>



          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-16 h-16 text-blue-600 animate-spin mb-6" />
              <div className="text-center">
                <p className="text-xl font-bold text-foreground mb-2 animate-pulse">
                  Đang tải sản phẩm
                </p>
                <p className="text-sm text-muted-foreground">
                  Đang lấy dữ liệu từ hệ thống...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Giá hiện tại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="bg-white/5 border-b border-gray-800 hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={async () => {
                        setShowDetailModal(true);
                        setLoadingDetails(true);
                        const response = await getProductAdminDetails(
                          product._id
                        );
                        if (response.success) {
                          setSelectedProduct(response.data);
                        } else {
                          setToast({
                            message: "Không thể tải chi tiết sản phẩm",
                            type: "error",
                          });
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
                            className="h-16 w-16 object-cover rounded-lg border border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                              {product.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeof product.category === "object"
                                ? product.category?.name
                                : product.category}
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-0.5">
                              {product.auction.bidCount} lượt đặt
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-primary">
                          {(
                            product.auction.currentPrice ||
                            product.auction.currentBid ||
                            0
                          ).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                            product.auction.status === "active"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : product.auction.status === "ended"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : product.auction.status === "scheduled"
                              ? "bg-gray-500/10 text-gray-500 border-gray-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          }`}
                        >
                          {product.auction.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/product/${product._id}`}
                          className="text-blue-500 hover:text-blue-400 mr-4 transition"
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
                          className="text-red-500 hover:text-red-400 transition"
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
                <div className="text-center py-12 text-muted-foreground">
                  Không tìm thấy sản phẩm nào.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal chi tiết sản phẩm */}
        {showDetailModal && selectedProduct && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="bg-background border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Chi tiết sản phẩm (Admin)
                    </h2>
                    <p className="text-blue-100">
                      Thông tin đầy đủ về sản phẩm và phiên đấu giá
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {loadingDetails && (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
              {!loadingDetails && (
                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Product Image */}
                    <div className="w-full md:w-5/12">
                      <div className="aspect-square rounded-xl overflow-hidden border border-border shadow-md bg-white flex items-center justify-center p-4">
                        <img
                          src={
                            selectedProduct.product?.primaryImageUrl ||
                            "/placeholder.svg"
                          }
                          alt={selectedProduct.product?.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="w-full md:w-7/12 space-y-6">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                          Tên sản phẩm
                        </label>
                        <h3 className="text-2xl font-bold text-foreground">
                          {selectedProduct.title ||
                            selectedProduct.product?.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                            Danh mục
                          </label>
                          <p className="text-foreground">
                            {selectedProduct.category?.name ||
                              selectedProduct.product?.categoryId?.name ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                            Người bán
                          </label>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {selectedProduct.seller?.username ||
                                selectedProduct.product?.sellerId?.username ||
                                "Unknown"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {selectedProduct.seller?.email ||
                                selectedProduct.product?.sellerId?.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <h4 className="font-semibold mb-4 text-foreground">
                          Thống kê đấu giá
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                            <span className="text-xs text-muted-foreground font-bold uppercase block mb-1">
                              Giá hiện tại
                            </span>
                            <span className="text-xl font-bold text-blue-500">{(selectedProduct.auction?.currentPrice || 0).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                            <span className="text-xs text-muted-foreground font-bold uppercase block mb-1">
                              Tổng số Bid
                            </span>
                            <span className="text-xl font-bold text-green-500">
                              {selectedProduct.auction?.bids?.length || 0}
                            </span>
                          </div>
                          <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                            <span className="text-xs text-muted-foreground font-bold uppercase block mb-1">
                              Người đặt
                            </span>
                            <span className="text-xl font-bold text-purple-500">
                              {
                                new Set(
                                  selectedProduct.auction?.bids?.map(
                                    (b) => b.bidder
                                  ) || []
                                ).size
                              }
                            </span>
                          </div>
                          <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                            <span className="text-xs text-muted-foreground font-bold uppercase block mb-1">
                              Trạng thái
                            </span>
                            <span
                              className={`text-xl font-bold capitalize ${
                                selectedProduct.auction?.status === "active"
                                  ? "text-green-500"
                                  : selectedProduct.auction?.status === "ended"
                                  ? "text-blue-500"
                                  : "text-yellow-500"
                              }`}
                            >
                              {selectedProduct.auction?.status || "active"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div>
                        <span className="text-muted-foreground block mb-1 font-bold">
                          Giá khởi điểm
                        </span>
                        <span className="text-foreground font-medium text-base">
                          {(
                            selectedProduct.auction?.startPrice || 0
                          ).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1 font-bold">
                          Bước giá
                        </span>
                        <span className="text-foreground font-medium text-base">
                          {(
                            selectedProduct.auction?.priceStep || 0
                          ).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                      <div>
                          <span className="text-muted-foreground block mb-1 font-bold">
                            Tự động gia hạn
                          </span>
                          <span
                            className={`font-medium text-base ${
                              selectedProduct.auction?.autoExtendEnabled
                                ? "text-green-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {selectedProduct.auction?.autoExtendEnabled
                              ? "Bật"
                              : "Tắt"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1 font-bold">
                            Thời gian bắt đầu
                          </span>
                          <span className="text-foreground font-medium">
                            {selectedProduct.auction?.startAt
                              ? new Date(
                                  selectedProduct.auction.startAt
                                ).toLocaleString('vi-VN')
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1 font-bold">
                            Thời gian kết thúc
                          </span>
                          <span className="text-foreground font-medium">
                            {selectedProduct.auction?.endAt
                              ? new Date(
                                  selectedProduct.auction.endAt
                                ).toLocaleString('vi-VN')
                              : "Chưa xác định"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1 font-bold">
                            Giá mua ngay
                          </span>
                          <span className="text-foreground font-medium text-base">
                            {(
                              selectedProduct.auction?.buyNowPrice || 0
                            ).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-muted/50 px-8 py-4 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-muted text-foreground hover:bg-muted/80 border border-border rounded-lg transition font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Xác nhận xóa sản phẩm
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Hành động này không thể hoàn tác
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Bạn có chắc chắn muốn xóa sản phẩm:
                  </p>
                  <p className="font-semibold text-gray-900 mb-3">
                    "{productToDelete?.title}"
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• Tất cả bids liên quan sẽ bị xóa</p>
                    <p>• Phiên đấu giá sẽ bị hủy</p>
                    <p>• Người dùng đã bid sẽ nhận email thông báo</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Xóa sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
