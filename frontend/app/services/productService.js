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
      status = null, // Không filter theo status để lấy tất cả
    } = params;

    const queryParams = { 
      page: 1, 
      limit: 999999, // Lấy tất cả sản phẩm (set limit rất lớn)
      sortBy
    };

    // Chỉ thêm status vào params nếu được chỉ định
    if (status) {
      queryParams.status = status;
    }

    const response = await api.get("/products", {
      params: queryParams,
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
  console.log("Creating product with data:", productData);
  // In so luong anh
  console.log("Number of images:", productData.getAll("images").length);
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
  try {
    const response = await api.delete(`/products/${productId}`);
    return {
      success: true,
      message: response.data.message || 'Xóa sản phẩm thành công',
      data: response.data.data
    };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa sản phẩm'
    };
  }
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

/**
 * API 3.2: Bổ sung thông tin mô tả sản phẩm
 * @param {string} productId - ID sản phẩm
 * @param {Object} data - { description, metadata }
 * @returns {Promise}
 */
export const updateProductDescription = async (productId, data) => {
  const response = await api.put(`/products/${productId}/description`, data);
  return response.data;
};

/**
 * API 3.3a: Từ chối lượt ra giá của bidder
 * @param {string} productId - ID sản phẩm
 * @param {string} bidderId - ID bidder cần từ chối
 * @param {string} reason - Lý do từ chối
 * @returns {Promise}
 */
export const rejectBidder = async (productId, bidderId, reason) => {
  const response = await api.post(`/products/${productId}/reject-bidder`, {
    bidderId,
    reason
  });
  return response.data;
};

/**
 * API 3.3b: Bidder tự rút lại bid
 * @param {string} productId - ID sản phẩm
 * @param {string} reason - Lý do rút bid (optional)
 * @returns {Promise}
 */
export const withdrawBid = async (productId, reason = '') => {
  const response = await api.post(`/products/${productId}/withdraw-bid`, {
    reason
  });
  return response.data;
};

/**
 * API 1.2: Lấy Top 5 sản phẩm cho Homepage
 * - Top 5 sắp kết thúc (endingSoon)
 * - Top 5 có nhiều bids nhất (mostBids)
 * - Top 5 có giá cao nhất (highestPrice)
 * @returns {Promise}
 */
export const getTopProducts = async () => {
  try {
    const response = await api.get("/products/home/top");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching top products:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch top products",
    };
  }
};

/**
 * API 1.4: Full-text search sản phẩm
 * Tìm kiếm với nhiều filter và sort options
 * @param {Object} params - Search parameters
 * @param {string} params.q - Từ khóa tìm kiếm (bắt buộc, ít nhất 2 ký tự)
 * @param {string} params.categoryId - ID danh mục (tùy chọn)
 * @param {number} params.minPrice - Giá tối thiểu (tùy chọn)
 * @param {number} params.maxPrice - Giá tối đa (tùy chọn)
 * @param {string} params.sortBy - Cách sắp xếp: relevance, price_asc, price_desc, ending_soon, most_bids
 * @param {number} params.page - Số trang (mặc định 1)
 * @param {number} params.limit - Số sản phẩm mỗi trang (mặc định 12)
 * @returns {Promise}
 */
export const searchProducts = async (params = {}) => {
  try {
    const {
      q,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = "relevance",
      page = 1,
      limit = 12,
    } = params;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return {
        success: false,
        error: "Vui lòng nhập từ khóa tìm kiếm (ít nhất 2 ký tự)",
      };
    }

    const queryParams = { q: q.trim(), sortBy, page, limit };
    
    // Add optional filters
    if (categoryId) queryParams.categoryId = categoryId;
    if (minPrice !== undefined && minPrice !== null) queryParams.minPrice = minPrice;
    if (maxPrice !== undefined && maxPrice !== null) queryParams.maxPrice = maxPrice;

    const response = await api.get("/products/search", { params: queryParams });

    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination,
      query: response.data.query,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error searching products:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi tìm kiếm sản phẩm",
    };
  }
};

/**
 * Lấy sản phẩm theo danh mục
 * @param {string} categoryId - ID danh mục
 * @param {Object} params - { page, limit, sortBy }
 * @returns {Promise}
 */
export const getProductsByCategory = async (categoryId, params = {}) => {
  try {
    const { page = 1, limit = 12, sortBy = "newest" } = params;

    const response = await api.get(`/products/category/${categoryId}`, {
      params: { page, limit, sortBy },
    });

    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi lấy sản phẩm theo danh mục",
    };
  }
};

/**
 * Format giá tiền VNĐ
 * @param {number} price 
 * @returns {string}
 */
export const formatPrice = (price) => {
  if (!price) return "0 VNĐ";
  return `${price.toLocaleString("vi-VN")} VNĐ`;
};

/**
 * Tính thời gian còn lại
 * @param {string} endAt - ISO date string
 * @returns {Object}
 */
export const calculateTimeRemaining = (endAt) => {
  if (!endAt) return { isEnded: true };
  
  const diff = new Date(endAt) - new Date();
  if (diff <= 0) return { isEnded: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, isEnded: false };
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
  getTopProducts,
  searchProducts,
  getProductsByCategory,
  formatPrice,
  calculateTimeRemaining,
};

export default productService;
