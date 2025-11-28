// SERVICE: Notification Service


import { Notification } from '../models/index.js';
import { NOTIFICATION_STATUS, NOTIFICATION_TYPES } from '../lib/constants.js';

export class NotificationService {
  /**
   * Tạo notification event để gửi email
   * @param {string} type - Loại notification (VD: 'bid_placed')
   * @param {Array} recipients - Danh sách { userId, email }
   * @param {Object} payload - Dữ liệu cần gửi trong email
   * @returns {Object} Notification document
   */
  async createNotification(type, recipients, payload) {
    const notification = new Notification({
      type,
      recipients,
      payload,
      status: NOTIFICATION_STATUS.PENDING
    });

    await notification.save();
    return notification;
  }

  /**
   * Lấy danh sách notifications pending (chưa gửi)
   * @param {number} limit - Số lượng lấy mỗi lần (mặc định 20)
   * @returns {Array} Danh sách notifications
   */
  async getPendingNotifications(limit = 20) {
    return await Notification.find({
      status: NOTIFICATION_STATUS.PENDING
    })
      .sort({ createdAt: 1 })
      .limit(limit);
  }

  /**
   * Đánh dấu notification là đã gửi
   * @param {string} notificationId - ID notification
   * @param {boolean} success - Gửi thành công hay thất bại
   */
  async markAsSent(notificationId, success = true) {
    const status = success ? NOTIFICATION_STATUS.SENT : NOTIFICATION_STATUS.FAILED;

    await Notification.findByIdAndUpdate(
      notificationId,
      {
        status,
        sentAt: new Date()
      }
    );
  }

  /**
   * Tạo notification khi có bid mới
   * @param {Object} bidData - { auctionId, bidderId, amount, previousBidderId, productTitle }
   */
  async notifyBidPlaced(bidData) {
    const { auctionId, bidderId, amount, previousBidderId, productTitle, sellerEmail, sellerUserId } = bidData;

    const recipients = [
      { userId: sellerUserId, email: sellerEmail }
    ];

    // Nếu có người đặt giá trước đó, notify họ bị outbid
    if (previousBidderId) {
      recipients.push({ userId: previousBidderId });
    }

    await this.createNotification(
      NOTIFICATION_TYPES.BID_PLACED,
      recipients,
      {
        auctionId,
        amount,
        productTitle,
        bidderName: bidderId.username
      }
    );
  }

  /**
   * Tạo notification khi auction kết thúc
   * @param {Object} auctionData - Thông tin auction
   */
  async notifyAuctionEnded(auctionData) {
    const { auctionId, sellerId, sellerEmail, winnerEmail, winnerId, productTitle, finalPrice } = auctionData;

    const recipients = [
      { userId: sellerId, email: sellerEmail },
      { userId: winnerId, email: winnerEmail }
    ];

    await this.createNotification(
      NOTIFICATION_TYPES.AUCTION_ENDED,
      recipients,
      {
        auctionId,
        productTitle,
        finalPrice,
        role: 'both' // seller hoặc winner
      }
    );
  }

  /**
   * Tạo notification khi bidder bị từ chối
   * @param {Object} rejectionData - Thông tin rejection
   */
  async notifyBidderRejected(rejectionData) {
    const { bidderId, bidderEmail, productTitle, reason } = rejectionData;

    await this.createNotification(
      NOTIFICATION_TYPES.BIDDER_REJECTED,
      [{ userId: bidderId, email: bidderEmail }],
      {
        productTitle,
        reason
      }
    );
  }

  /**
   * Tạo notification khi có câu hỏi mới
   * @param {Object} questionData - Thông tin câu hỏi
   */
  async notifyQuestionAsked(questionData) {
    const { productId, sellerId, sellerEmail, askerName, questionText } = questionData;

    await this.createNotification(
      NOTIFICATION_TYPES.QUESTION_ASKED,
      [{ userId: sellerId, email: sellerEmail }],
      {
        productId,
        askerName,
        questionText
      }
    );
  }

  /**
   * Tạo notification khi có trả lời cho câu hỏi
   * @param {Object} answerData - Thông tin trả lời
   */
  async notifyQuestionAnswered(answerData) {
    const { questionId, answererName, answerText, bidderEmails, bidderIds } = answerData;

    const recipients = bidderEmails.map((email, idx) => ({
      userId: bidderIds[idx],
      email
    }));

    await this.createNotification(
      NOTIFICATION_TYPES.QUESTION_ANSWERED,
      recipients,
      {
        questionId,
        answererName,
        answerText
      }
    );
  }

  /**
   * Lấy tất cả notifications của một user
   * @param {string} userId - ID user
   * @param {number} page - Trang (mặc định 1)
   * @param {number} limit - Số record mỗi trang (mặc định 10)
   * @returns {Object} { notifications, total, page, pages }
   */
  async getUserNotifications(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({
        'recipients.userId': userId
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({
        'recipients.userId': userId
      })
    ]);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}

export const notificationService = new NotificationService();
