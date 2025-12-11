// SERVICE: Product Service - Quản lý sản phẩm

import api from "./api.js";

/**
 * Lấy chi tiết sản phẩm theo ID
 * @param {string} productId - ID của sản phẩm
 * @returns {Promise}
 */
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`);  
    // Backend returns { data: { product, relatedProducts } }
    const productData = response.data.data;
    
    return {
      success: true,
      data: {
        ...productData.product,
        relatedProducts: productData.relatedProducts || []
      },
      message: response.data.message
    };
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch product",
    };
  }
};

/**
 * Lấy danh sách tất cả sản phẩm
 * @param {Object} params - { page, limit, sortBy, status }
 * @returns {Promise}
 */
export const getProducts = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = "newest",
      status = "active",
    } = params;

    const response = await api.get("/products", {
      params: { page, limit, sortBy, status },
    });

    return {
      success: true,
      data: response.data.data, 
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch products",
    };
  }
};


export const getAllProducts = async (params = {}) => {
  try {
    const {
      sortBy = "newest",
      status = "active",
    } = params;

    const response = await api.get("/products", {
      params: { 
        page: 1, 
        limit: 999999, // Lấy tất cả sản phẩm (set limit rất lớn)
        sortBy, 
        status 
      },
    });

    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch products",
    };
  }
};

/**
 * Tạo sản phẩm mới (seller)
 * @param {Object} productData - Dữ liệu sản phẩm
 * @returns {Promise}
 */
export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  return response.data;
};

/**
 * Cập nhật sản phẩm (seller)
 * @param {string} productId - ID sản phẩm
 * @param {Object} productData - Dữ liệu cập nhật
 * @returns {Promise}
 */
export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

/**
 * Xóa sản phẩm (admin)
 * @param {string} productId - ID sản phẩm
 * @returns {Promise}
 */
export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

/**
 * Đặt giá thầu cho sản phẩm
 * @param {string} productId - ID sản phẩm
 * @param {Object} bidData - { amount }
 * @returns {Promise}
 */
export const placeBid = async (productId, bidData) => {
  const response = await api.post(`/products/${productId}/bids`, bidData);
  return response.data;
};

/**
 * Lấy lịch sử đấu giá của sản phẩm
 * @param {string} productId - ID sản phẩm
 * @returns {Promise}
 */
export const getBidHistory = async (productId) => {
  const response = await api.get(`/products/${productId}/bids`);
  return response.data;
};

const productService = {
  getProductById,
  getProducts,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  placeBid,
  getBidHistory,
};

export default productService;
