import api from './api';

const categoryService = {
  async getAllCategories() {
    try {
      const response = await api.get('/categories');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories'
      };
    }
  },

  async getCategoryById(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching category:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch category'
      };
    }
  },

  async createCategory(categoryData) {
    try {
      console.log("Creating category with data:", categoryData);
      const response = await api.post('/categories', categoryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Tạo danh mục thành công'
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create category'
      };
    }
  },

  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(`/categories/${categoryId}`, categoryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Cập nhật danh mục thành công'
      };
    } catch (error) {
      console.error('Error updating category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category'
      };
    }
  },

  async deleteCategory(categoryId) {
    try {
      const response = await api.delete(`/categories/${categoryId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Xóa danh mục thành công'
      };
    } catch (error) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error?.message || 'Failed to delete category'
      };
    }
  }
};

export default categoryService;
