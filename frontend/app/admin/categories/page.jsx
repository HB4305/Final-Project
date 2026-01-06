import React, { useState, useEffect } from "react";
import {
  Loader,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Eye,
} from "lucide-react";
import AdminNavigation from "../../../components/admin-navigation";
import categoryService from "../../services/categoryService";
import Pagination from "../../../components/Pagination";

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
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem);

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

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

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

  const openDetailModal = (category) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
            <div>
              <h2 className="font-semibold text-xl">Quản lý danh mục</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Danh sách các danh mục sản phẩm
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Thêm danh mục
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-16 h-16 text-blue-600 animate-spin mb-6" />
              <div className="text-center">
                <p className="text-xl font-bold text-foreground mb-2 animate-pulse">
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ maxWidth: '400px' }}>
                      Tên danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" style={{ minWidth: '120px' }}>
                      Số sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" style={{ minWidth: '150px' }}>
                      Danh mục chi tiết
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" style={{ minWidth: '140px' }}>
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        Không tìm thấy danh mục nào. Hãy thêm danh mục mới.
                      </td>
                    </tr>
                  ) : (
                    currentCategories.map((category) => (
                      <React.Fragment key={category._id}>
                        {/* Parent Category Row */}
                        <tr className="bg-white/5 border-b border-gray-800 hover:bg-white/10 transition-colors">
                          <td className="px-6 py-4" style={{ maxWidth: '400px' }}>
                            <div className="flex items-center gap-2">
                              {category.children && category.children.length > 0 ? (
                                <button
                                  onClick={() => toggleCategory(category._id)}
                                  className="p-1 hover:bg-white/10 rounded transition"
                                >
                                  {expandedCategories.has(category._id) ? (
                                    <ChevronDown className="w-4 h-4 text-primary" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-6 h-6" />
                              )}
                              <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                              <span className="font-semibold text-foreground truncate">
                                {category.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                            <span className="font-semibold">
                              {category.productCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '150px' }}>
                            {category.children && category.children.length > 0 ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                {category.children.length} danh mục
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap" style={{ minWidth: '140px' }}>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(category)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmDelete(category)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Subcategories - Only show when expanded */}
                        {expandedCategories.has(category._id) &&
                          category.children &&
                          category.children.map((subCategory) => (
                            <tr
                              key={subCategory._id}
                              className="bg-white/3 border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                            >
                              <td className="px-6 py-4" style={{ maxWidth: '400px' }}>
                                <div className="flex items-center gap-2 pl-10">
                                  <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                  <span className="text-sm text-foreground truncate">
                                    {subCategory.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '120px' }}>
                                <span className="text-sm">
                                  {subCategory.productCount || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '150px' }}>
                                <span className="text-sm text-muted-foreground">—</span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap" style={{ minWidth: '140px' }}>
                                <div className="flex justify-end gap-2">F
                                  <button
                                    onClick={() => openEditModal(subCategory)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(subCategory)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {categories.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={categories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCategory && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-muted/50 border-b border-border p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">Chi tiết danh mục</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Tên danh mục
                  </p>
                  <p className="text-foreground font-semibold text-lg">
                    {selectedCategory.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Slug
                  </p>
                  <p className="text-foreground font-mono text-sm">
                    {selectedCategory.slug || "Chưa có"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Cấp độ
                  </p>
                  <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Level {selectedCategory.level || 1}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Số sản phẩm
                  </p>
                  <p className="text-foreground font-semibold text-lg">
                    {selectedCategory.productCount || 0} sản phẩm
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    ID
                  </p>
                  <p className="text-muted-foreground font-mono text-xs bg-muted/30 p-2 rounded border border-border">
                    {selectedCategory._id}
                  </p>
                </div>

                {selectedCategory.description && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Mô tả
                    </p>
                    <p className="text-foreground">
                      {selectedCategory.description}
                    </p>
                  </div>
                )}

                {selectedCategory.children && selectedCategory.children.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Danh mục con ({selectedCategory.children.length})
                    </p>
                    <div className="space-y-2">
                      {selectedCategory.children.map((child) => (
                        <div
                          key={child._id}
                          className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border"
                        >
                          <FolderOpen className="w-4 h-4 text-blue-500" />
                          <span className="text-foreground font-medium">{child.name}</span>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {child.productCount || 0} sản phẩm
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 px-8 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedCategory);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/20"
              >
                Chỉnh sửa
              </button>
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
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900/95 backdrop-blur border-b border-gray-700 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Tên danh mục
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên danh mục..."
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Nhập mô tả danh mục..."
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-h-[100px]"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/20"
                >
                  {editingCategory ? "Cập nhật" : "Thêm mới"}
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
