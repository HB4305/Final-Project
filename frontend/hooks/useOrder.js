import { useCallback } from "react";
import { useState } from "react";
import orderService from "../app/services/orderService.js";
import { useEffect } from "react";

export function useOrder(orderId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await orderService;
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const submitPayment = async (paymentData) => {
    try {
      const response = await orderService.submitPayment(orderId, paymentData);
      setOrders(response.data.order);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const confirmPayment = async () => {
    try {
      const response = await orderService.confirmPayment(orderId);
      setOrders(response.data.order);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const markAsShipped = async (shippingData) => {
    try {
      const response = await orderService.markAsShipped(orderId, shippingData);
      setOrders(response.data.order);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const confirmDelivery = async (data) => {
    try {
      const response = await orderService.confirmDelivery(orderId, data);
      setOrders(response.data.order);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const rateTransaction = async (ratingData) => {
    try {
      const response = await orderService.rateTransaction(orderId, ratingData);
      setOrders(response.data.order);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const cancelOrder = async (reason) => {
    try {
      const response = await orderService.cancelOrder(orderId, reason);
      setOrders(response.data.order);
      return response;
    } catch (err) {
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    actions: {
      submitPayment,
      confirmPayment,
      markAsShipped,
      confirmDelivery,
      rateTransaction,
      cancelOrder,
      refect: fetchOrders,
    },
  };
}
