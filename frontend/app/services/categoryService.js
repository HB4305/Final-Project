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
  }
};

export default categoryService;
