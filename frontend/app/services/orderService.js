
import api from "./api.js";

export const orderService = {
  createOrderFromAuction: async (auctionId) => {
    try {
      const response = await api.post("/orders/create-from-auction", {
        auctionId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create order" };
    }
  },

  getMyOrders: async (filter = {}) => {
    try {
      const { status = "all", role = "all", page = 1, limit = 10 } = filter;
      const response = await api.get("/orders/my-orders", {
        params: { status, role, page, limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch orders" };
    }
  },

  getOrderByAuctionId: async (auctionId) => {
    try {
      const response = await api.get(`/orders/by-auction/${auctionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch order" };
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch order details" }
      );
    }
  },

  submitPayment: async (orderId, data) => {
    try {
      const response = await api.post(
        `/orders/${orderId}/submit-payment`,
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to submit payment" };
    }
  },

  confirmPayment: async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/confirm-payment`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to confirm payment" };
    }
  },

  markAsShipped: async (orderId, shippingData) => {
    try {
      const response = await api.post(
        `/orders/${orderId}/mark-shipped`,
        shippingData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to mark as shipped" };
    }
  },

  confirmDelivery: async (orderId, data = {}) => {
    const response = await api.post(
      `/orders/${orderId}/confirm-delivery`,
      data
    );
    return response.data;
  },

  rateTransaction: async (orderId, ratingData) => {
    try {
      const response = await api.post(`/orders/${orderId}/rate`, ratingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to submit rating" };
    }
  },

  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to cancel order" };
    }
  },

  getChatMessages: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/chat`);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch chat messages" }
      );
    }
  },

  sendChatMessage: async (orderId, messageData) => {
    try {
      const response = await api.post(`/orders/${orderId}/chat/`, messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to send chat message" };
    }
  },
};

export default orderService;