import { AppError } from "../utils/errors.js";
import { NotificationService } from "../services/NotificationService.js";
import Auction from "../models/Auction.js";
import Order from "../models/Order.js";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";

// Create NotificationService instance
const notificationService = new NotificationService();

export const createOrderFromAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.body;

    const auction = await Auction.findById(auctionId)
      .populate("productId")
      .populate("currentHighestBidderId");

    if (!auction) {
      throw new AppError("Auction not found", 404);
    }

    if (auction.status !== "ended") {
      throw new AppError("Auction has not ended yet", 400);
    }

    if (!auction.currentHighestBidderId) {
      throw new AppError("No bids were placed on this auction", 400);
    }

    const existingOrder = await Order.findOne({ auctionId });
    if (existingOrder) {
      throw new AppError("Order for this auction already exists", 400);
    }

    // Create order
    const order = await Order.create({
      auctionId: auction._id,
      productId: auction.productId._id,
      buyerId: auction.currentHighestBidderId._id,
      sellerId: auction.sellerId,
      finalPrice: auction.currentPrice,
      status: "awaiting_payment",
    });

    await notificationService.createNotification({
      userId: order.buyerId,
      type: "order_created",
      title: "Congratulations! You won the auction",
      message: `Please proceed to payment for "${auction.productId.title}".`,
      relatedId: order._id,
      relatedModel: "Order",
    });

    await notificationService.createNotification({
      userId: order.sellerId,
      type: "order_created",
      title: "Your auction is ended",
      message: `Waiting for buyer to submit payment for "${auction.productId.title}".`,
      relatedId: order._id,
      relatedModel: "Order",
    });

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByAuctionId = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    let order = await Order.findOne({ auctionId })
      .populate("productId", "title slug primaryImageUrl imageUrls")
      .populate("buyerId", "fullName email contactPhone ratingSummary")
      .populate("sellerId", "fullName email contactPhone ratingSummary");

    // If order doesn't exist, check if auction ended with winner and auto-create order
    if (!order) {
      const auction = await Auction.findById(auctionId)
        .populate("productId")
        .populate("currentHighestBidderId");

      if (!auction) {
        throw new AppError("Auction not found", 404);
      }

      // If auction ended with winner, create order automatically
      if (auction.status === "ended" && auction.currentHighestBidderId) {
        order = await Order.create({
          auctionId: auction._id,
          productId: auction.productId._id,
          buyerId: auction.currentHighestBidderId._id,
          sellerId: auction.sellerId,
          finalPrice: auction.currentPrice,
          currency: auction.productId.baseCurrency || "VND",
          status: "awaiting_payment",
        });

        // Notify buyer
        await notificationService.createNotification({
          userId: order.buyerId,
          type: "order_created",
          title: "Congratulations! You won the auction",
          message: `Please proceed with payment for "${auction.productId.title}"`,
          relatedId: order._id,
          relatedModel: "Order",
        });

        // Notify seller
        await notificationService.createNotification({
          userId: order.sellerId,
          type: "order_created",
          title: "Your auction has ended",
          message: `Waiting for buyer to submit payment for "${auction.productId.title}"`,
          relatedId: order._id,
          relatedModel: "Order",
        });

        // Re-populate order
        order = await Order.findById(order._id)
          .populate("productId", "title slug primaryImageUrl imageUrls")
          .populate("buyerId", "fullName email contactPhone ratingSummary")
          .populate("sellerId", "fullName email contactPhone ratingSummary");
      } else {
        throw new AppError("No order available for this auction yet", 404);
      }
    }

    const buyerId = order.buyerId?._id ? order.buyerId._id.toString() : order.buyerId.toString();
    const sellerId = order.sellerId?._id ? order.sellerId._id.toString() : order.sellerId.toString();
    const userId = req.user._id.toString();

    const isAdmin = req.user.roles.includes("admin") || req.user.roles.includes("superadmin");
    const isAuthorized =
      buyerId === userId ||
      sellerId === userId ||
      isAdmin;

    if (!isAuthorized) {
      throw new AppError("Not authorized to view this order", 403);
    }

    let userRole = null;
    if (buyerId === userId) {
      userRole = "buyer";
    } else if (sellerId === userId) {
      userRole = "seller";
    } else {
      userRole = "admin";
    }

    const buyerRating = await Rating.findOne({
      orderId: order._id,
      raterId: order.buyerId,
    });
    const sellerRating = await Rating.findOne({
      orderId: order._id,
      raterId: order.sellerId,
    });

    res.status(200).json({
      status: "success",
      data: {
        order,
        userRole,
        ratings: {
          buyerRating,
          sellerRating,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("productId", "title slug primaryImageUrl imageUrls")
      .populate("buyerId", "fullName email contactPhone ratingSummary")
      .populate("sellerId", "fullName email contactPhone ratingSummary")
      .lean();

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const isAdmin = req.user.roles.includes("admin") || req.user.roles.includes("superadmin");
    const isAuthorized =
      order.buyerId._id.toString() === req.user._id.toString() ||
      order.sellerId._id.toString() === req.user._id.toString() ||
      isAdmin;

    if (!isAuthorized) {
      throw new AppError("Not authorized to view this order", 403);
    }

    let userRole = null;
    if (order.buyerId._id.toString() === req.user._id.toString()) {
      userRole = "buyer";
    } else if (order.sellerId._id.toString() === req.user._id.toString()) {
      userRole = "seller";
    } else {
      userRole = "admin";
    }

    const ratings = await Rating.find({ orderId: order._id })
      .populate("raterId", "username fullName")
      .populate("rateeId", "username fullName")
      .lean();

    res.status(200).json({
      status: "success",
      data: { order, userRole, ratings },
    });
  } catch (error) {
    next(error);
  }
};

// Step 1: Submit payment info
export const submitPaymentInfo = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentProofUrl, paymentNote, shippingAddress } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      throw new AppError("Only the buyer can submit payment information", 403);
    }

    if (order.status !== "awaiting_payment") {
      throw new AppError("Order is not in awaiting payment status", 400);
    }

    if (!paymentProofUrl || !shippingAddress) {
      throw new AppError(
        "Payment proof and shipping address are required",
        400
      );
    }

    // Standardize payment proof structure
    order.buyerPaymentProof = {
      url: paymentProofUrl,
      uploadedAt: new Date(),
    };

    // Note: Order model doesn't have metadata field, so we cannot save address there.
    // Instead we will pass it via notification to seller.

    await order.save();

    await notificationService.createNotification(
      "payment_submitted",
      [{ userId: order.sellerId }], // Recipients must be an array
      {
        title: "Buyer Submitted Payment Information",
        message: `Buyer submitted payment. Address: ${shippingAddress}. Note: ${paymentNote || 'None'}`,
        relatedId: order._id,
        relatedModel: "Order",
      }
    );

    res.status(200).json({
      status: "success",
      message: "Payment information submitted successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Step 2a: Confirm payment
export const confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.sellerId.toString() !== req.user._id.toString()) {
      throw new AppError("Only the seller can confirm payment", 403);
    }

    if (order.status !== "awaiting_payment") {
      if (order.status === "seller_confirmed_payment") {
        return res.status(200).json({
          status: "success",
          message: "Payment already confirmed",
          data: { order },
        });
      }
      throw new AppError("Payment has not been submitted or order is in valid status", 400);
    }

    if (!order.buyerPaymentProof || !order.buyerPaymentProof.url) {
      throw new AppError("No payment proof submitted by buyer", 400);
    }

    order.status = "seller_confirmed_payment";
    await order.save();

    await notificationService.createNotification(
      "payment_confirmed",
      [{ userId: order.buyerId }],
      {
        title: "Seller confirmed payment",
        message: "Your payment has been confirmed by the seller.",
        relatedId: order._id,
        relatedModel: "Order",
      }
    );

    res.status(200).json({
      status: "success",
      message: "Payment confirmed successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Step 2b: Mark as shipped
export const markAsShipped = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { shippingCarrier, trackingNumber, shippingNote } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.sellerId.toString() !== req.user._id.toString()) {
      throw new AppError("Only the seller can mark the order as shipped", 403);
    }

    if (order.status !== "seller_confirmed_payment") {
      throw new AppError("Payment must be confirmed before shipping", 400);
    }

    if (!shippingCarrier || !trackingNumber) {
      throw new AppError(
        "Shipping carrier and tracking number are required",
        400
      );
    }

    order.shippingInfo = {
      carrier: shippingCarrier,
      trackingNumber,
      shippedAt: new Date(),
    };
    order.status = "shipped";

    await order.save();

    await notificationService.createNotification(
      "order_shipped",
      [{ userId: order.buyerId }],
      {
        title: "Your order has been shipped",
        message: `Track number: '${trackingNumber}'`,
        relatedId: order._id,
        relatedModel: "Order",
      }
    );

    res.status(200).json({
      status: "success",
      message: "Order marked as shipped",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Step 3: Confirm delivery
export const confirmDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { receivedNote } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      throw new AppError("Only the buyer can confirm delivery", 403);
    }

    if (order.status !== "shipped") {
      throw new AppError(
        "Order must be shipped before confirming delivery",
        400
      );
    }

    order.buyerConfirmReceivedAt = new Date();
    order.status = "completed";

    if (receivedNote) {
      order.metadata = {
        ...order.metadata,
        receivedNote,
      };
    }

    await order.save();

    await notificationService.createNotification(
      "order_completed",
      [{ userId: order.sellerId }],
      {
        title: "Buyer confirmed delivery",
        message: "The buyer has received the item. Please provide a rating.",
        relatedId: order._id,
        relatedModel: "Order",
      }
    );

    await notificationService.createNotification(
      "rating_reminder",
      [{ userId: order.buyerId }],
      {
        title: "Please rate your transaction",
        message: "Share your experience with the seller",
        relatedId: order._id,
        relatedModel: "Order",
      }
    );

    res.status(200).json({
      status: "success",
      message: "Delivery confirmed successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Step 4: rate transaction
export const rateTransaction = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { score, comment } = req.body;
    const raterId = req.user._id;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    /* 
    // Allow rating anytime
    if (order.status !== "completed") {
      throw new AppError("Can only rate after delivery is confirmed", 400);
    }
    */

    let rateeId, context;

    if (order.buyerId.toString() === raterId.toString()) {
      rateeId = order.sellerId;
      context = "buyer_to_seller";
    } else if (order.sellerId.toString() === raterId.toString()) {
      rateeId = order.buyerId;
      context = "seller_to_buyer";
    } else {
      throw new AppError(
        "You are not authorized to rate this transaction",
        403
      );
    }

    if (![1, -1].includes(score)) {
      throw new AppError("Score must be 1 or -1", 400);
    }

    let rating = await Rating.findOne({ orderId, raterId });

    if (rating) {
      const oldScore = rating.score;
      rating.score = score;
      rating.comment = comment;
      rating.updatedAt = new Date();
      await rating.save();

      await updateUserRatingSummary(rateeId, oldScore, score);
    } else {
      rating = await Rating.create({
        raterId,
        rateeId,
        orderId,
        context,
        score,
        comment,
      });
      await updateUserRatingSummary(rateeId, null, score);
    }

    res.status(200).json({
      status: "success",
      message: "Rating submitted successfully",
      data: { rating, order },
    });
  } catch (error) {
    next(error);
  }
};

async function updateUserRatingSummary(userId, oldScore, newScore) {
  const user = await User.findById(userId);
  if (!user) return;

  if (oldScore !== null) {
    if (oldScore === 1) {
      user.ratingSummary.countPositive -= 1;
    } else {
      user.ratingSummary.countNegative -= 1;
    }
    user.ratingSummary.totalCount -= 1;
  }

  if (newScore === 1) {
    user.ratingSummary.countPositive += 1;
  } else {
    user.ratingSummary.countNegative += 1;
  }
  user.ratingSummary.totalCount += 1;

  user.ratingSummary.score =
    user.ratingSummary.totalCount > 0
      ? user.ratingSummary.countPositive / user.ratingSummary.totalCount
      : 0;

  await user.save();
}

// Cancel order
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.sellerId.toString() !== sellerId.toString()) {
      throw new AppError("Only the seller can cancel the order", 403);
    }

    if (order.status === "completed") {
      throw new AppError("Cannot cancel a completed order", 400);
    }

    order.status = "cancelled";
    order.metadata = {
      ...order.metadata,
      cancellationReason: reason,
      cancelledAt: new Date(),
    };

    await order.save();

    const rating = await Rating.create({
      raterId: sellerId,
      rateeId: order.buyerId,
      orderId: order._id,
      context: "seller_to_buyer",
      score: -1,
      comment: reason || "Transaction cancelled by seller",
    });

    await updateUserRatingSummary(order.buyerId, null, -1);

    await notificationService.createNotification(
      "order_cancelled",
      [{ userId: order.buyerId }],
      {
        title: "Transaction cancelled",
        message: `Seller cancelled the transaction. Reason: ${reason}`,
        relatedId: order._id,
        relatedModel: "Order",
      }
    );

    res.status(200).json({
      status: "success",
      message: "Transaction cancelled and buyer rated -1",
      data: { order, rating },
    });
  } catch (error) {
    next(error);
  }
};

// Get my orders
export const getMyOrders = async (req, res, next) => {
  try {
    const { role = "all", status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    let query = {};

    if (role === "buyer") {
      query.buyerId = userId;
    } else if (role === "seller") {
      query.sellerId = userId;
    } else {
      query.$or = [{ buyerId: userId }, { sellerId: userId }];
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate("productId", "title primaryImageUrl")
      .populate("buyerId", "username fullName")
      .populate("sellerId", "username fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { limit = 50 } = req.query;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const isAuthorized =
      order.buyerId.toString() === req.user._id.toString() ||
      order.sellerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      throw new AppError('Not authorized to view chat', 403);
    }

    const messages = await ChatMessage.find({ orderId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'username fullName')
      .lean();

    await ChatMessage.updateMany(
      {
        orderId,
        recipientId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      status: 'success',
      data: { messages: messages.reverse() }
    });
  } catch (error) {
    next(error);
  }
};

export const sendChatMessage = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { message, attachmentUrl } = req.body;

    if (!message || message.trim() === '') {
      throw new AppError('Message cannot be empty', 400);
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const isAuthorized =
      order.buyerId.toString() === req.user._id.toString() ||
      order.sellerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      throw new AppError('Not authorized to send message', 403);
    }

    const recipientId = order.buyerId.toString() === req.user._id.toString()
      ? order.sellerId
      : order.buyerId;

    const chatMessage = await ChatMessage.create({
      orderId,
      senderId: req.user._id,
      recipientId,
      message: message.trim(),
      attachmentUrl
    });

    await chatMessage.populate('senderId', 'username fullName');

    const recipientUser = await User.findById(recipientId).select('email');
    if (recipientUser && recipientUser.email) {
      await notificationService.createNotification(
        'new_message',
        [{ userId: recipientId, email: recipientUser.email }],
        {
          title: 'New message',
          message: `${req.user.username}: ${message.substring(0, 50)}...`,
          orderId: order._id,
          senderUsername: req.user.username,
        }
      );
    }

    res.status(201).json({
      status: 'success',
      data: { message: chatMessage }
    });
  } catch (error) {
    next(error);
  }
};