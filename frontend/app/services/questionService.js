// SERVICE: Question Service - Quản lý Q&A giữa buyer và seller

import api from "./api.js";

/**
 * Lấy danh sách câu hỏi của sản phẩm
 * @param {string} productId - ID của sản phẩm
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getProductQuestions = async (productId, params = {}) => {
  try {
    const { page = 1, limit = 10 } = params;
    
    const response = await api.get(`/questions/product/${productId}`, {
      params: { page, limit }
    });

    return {
      success: true,
      data: response.data.data, // { questions, pagination }
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch questions",
    };
  }
};

/**
 * Tạo câu hỏi mới (buyer)
 * @param {string} productId - ID của sản phẩm
 * @param {string} content - Nội dung câu hỏi
 * @returns {Promise}
 */
export const createQuestion = async (productId, content) => {
  try {
    const response = await api.post("/questions", {
      productId,
      content
    });

    return {
      success: true,
      data: response.data.data, // question object
      message: response.data.message
    };
  } catch (error) {
    console.error("Error creating question:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create question",
    };
  }
};

/**
 * Trả lời câu hỏi (seller)
 * @param {string} questionId - ID của câu hỏi
 * @param {string} text - Nội dung câu trả lời
 * @returns {Promise}
 */
export const answerQuestion = async (questionId, text) => {
  try {
    const response = await api.post(`/questions/${questionId}/answer`, {
      text
    });

    return {
      success: true,
      data: response.data.data, // updated question object
      message: response.data.message
    };
  } catch (error) {
    console.error("Error answering question:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to answer question",
    };
  }
};

/**
 * Xóa câu hỏi (author hoặc admin)
 * @param {string} questionId - ID của câu hỏi
 * @returns {Promise}
 */
export const deleteQuestion = async (questionId) => {
  try {
    const response = await api.delete(`/questions/${questionId}`);

    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete question",
    };
  }
};

export default {
  getProductQuestions,
  createQuestion,
  answerQuestion,
  deleteQuestion
};
