import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AdminNavigation from "../../../components/admin-navigation";
import categoryService from "../../services/categoryService";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [modalMessage, setModalMessage] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAllCategories();
      console.log("[CATEGORY ADMIN]:", response.data);
      if (response.success) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let response;
      if (editingCategory) {
        response = await categoryService.updateCategory(
          editingCategory._id,
          formData
        );
      } else {
        response = await categoryService.createCategory(formData);
      }

      if (response.success) {
        console.log("[CATEGORY ADMIN]:", response.data);
        setModalMessage(response.message);
        setShowSuccessModal(true);
        setShowModal(false);
        setFormData({ name: "", description: "" });
        setEditingCategory(null);
        fetchCategories();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await categoryService.deleteCategory(
        categoryToDelete._id
      );

      if (response.success) {
        setModalMessage(response.message);
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        setModalMessage("Lỗi: " + response.message);
        setShowErrorModal(true);
        setShowDeleteModal(false);
      }
    } catch (error) {
      setModalMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      setShowErrorModal(true);
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavigation />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="font-semibold">Danh sách danh mục</h2>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm danh mục
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-lg animate-pulse shadow-lg"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground mb-2">
                  Đang tải danh mục
                </p>
                <p className="text-sm text-muted-foreground">
                  Đang lấy dữ liệu danh mục...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      TÊN DANH MỤC
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      HÀNH ĐỘNG
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((category) => (
                    <tr
                      key={category._id}
                      className="bg-white/5 border-b border-gray-800 hover:bg-white/10 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {category._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(category)}
                          className="text-blue-500 hover:text-blue-400 mr-4 transition"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => confirmDelete(category)}
                          className="text-red-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  Không tìm thấy danh mục nào. Hãy thêm danh mục mới.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Thành công!
              </h3>
              <p className="text-gray-300 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg shadow-green-600/20"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lỗi</h3>
              <p className="text-gray-300 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg shadow-red-600/20"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900/95 backdrop-blur border-b border-gray-700 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {showEditModal ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                </h2>
                <button
                  onClick={closeModals}
                  className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={
                showEditModal ? handleEditCategory : handleCreateCategory
              }
              className="p-6"
            >
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-5 py-2.5 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/20"
                >
                  {showEditModal ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Xác nhận xóa
                </h3>
                <p className="text-sm text-gray-400">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <span className="font-bold text-white">"{categoryToDelete?.name}"</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20"
              >
                Xóa danh mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
