// SERVICE: Bid Service (Core Business Logic)

import {
  Auction,
  Bid,
  RejectedBidder,
  SystemSetting,
  User,
} from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { AUCTION_STATUS, ERROR_CODES } from "../lib/constants.js";
import {
    sendBidSuccessNotification,
    sendPriceUpdatedNotification,
    sendOutbidNotification,
    sendBidRejectedNotification
} from '../utils/email.js';

export class BidService {
  /**
   * Đặt giá cho sản phẩm đấu giá
   * Kiểm tra: reject bidder, giá hợp lệ, auction active, atomic update
   * @param {string} auctionId - ID cuộc đấu giá
   * @param {string} bidderId - ID người đặt giá
   * @param {number} bidAmount - Số tiền đặt giá
   * @returns {Object} { success, currentPrice, currentHighestBidderId }
   */
  async placeBid(auctionId, bidderId, bidAmount) {
    // 1. Lấy thông tin auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new AppError("Cuộc đấu giá không tồn tại", 404);
    }

    // 2. Kiểm tra auction còn hoạt động không
    if (auction.status !== AUCTION_STATUS.ACTIVE) {
      throw new AppError(
        "Cuộc đấu giá đã kết thúc hoặc không hoạt động",
        400,
        ERROR_CODES.AUCTION_NOT_ACTIVE
      );
    }

    // 3. Kiểm tra thời gian
    if (new Date() > new Date(auction.endAt)) {
      throw new AppError(
        "Cuộc đấu giá đã kết thúc",
        400,
        ERROR_CODES.AUCTION_NOT_ACTIVE
      );
    }

    // 4. Kiểm tra bidder đã bị từ chối chưa
    const isRejected = await RejectedBidder.findOne({
      productId: auction.productId,
      bidderId,
    });
    if (isRejected) {
      throw new AppError(
        "Bạn không được phép đặt giá cho sản phẩm này",
        403,
        ERROR_CODES.BIDDER_REJECTED
      );
    }

    // 5. Kiểm tra rating của bidder (nếu cần)
    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new AppError("Người dùng không tồn tại", 404);
    }

    // 6. Kiểm tra rating phải lớn hơn 80%
    const ratingPercentage = bidder.ratingSummary?.score * 100 || 0;
    if (ratingPercentage < 80) {
      throw new AppError(
        `Điểm đánh giá của bạn (${ratingPercentage}%) phải >= 80% để đặt giá`,
        403,
        ERROR_CODES.RATING_TOO_LOW
      );
    }

    // 7. Tính giá tối thiểu được phép đặt
    const minAllowedBid = auction.currentPrice + auction.priceStep;
    if (bidAmount < minAllowedBid) {
      throw new AppError(
        `Giá đặt phải ít nhất ${minAllowedBid}`,
        400,
        ERROR_CODES.BID_TOO_LOW
      );
    }

    /**
     * API 3.1: Tự động gia hạn
     * Lấy cấu hình hệ thống
     */

    const autoExtendEnabled = await SystemSetting.getSetting(
      "autoExtendEnabled",
      true
    );
    const autoExtendThreshold = await SystemSetting.getSetting(
      "autoExtendThreshold",
      5
    );
    const autoExtendDuration = await SystemSetting.getSetting(
      "autoExtendDuration",
      10
    );

    console.log(`[BID SERVICE] Auto-extend config:`);
    console.log(`  - Tự động bật: ${autoExtendEnabled}`);
    console.log(`  - Ngưỡng: ${autoExtendThreshold} phút`);
    console.log(`  - Thời gian được gia hạn: ${autoExtendDuration} phút`);

    let autoExtended = false;
    let newEndTime = auction.endTime;

    if (autoExtendEnabled) {
      // Tính thời gian còn lại
      const timeRemaining = auction.endTime - now;
      const threshold = autoExtendThreshold * 60 * 1000;
      const duration = autoExtendDuration * 60 * 1000;

      const minutesLeft = Math.floor(timeRemaining / 1000 / 60);
      console.log(`[BID SERVICE] Thời gian còn lại ${timeRemaining} phút`);

      // Nếu thời gian còn lại <= threshold, tiến hành gia hạn
      if (timeRemaining <= threshold && timeRemaining > 0) {
        console.log(
          `[BID SERVICE] Tự động gia hạn thêm: ${autoExtendDuration} phút`
        );

        newEndTime = new Date(auction.endTime.getTime() + duration);
        autoExtended = true;

        // Cập nhật auction
        auction.endTime = newEndTime;
        auction.autoExtendCount += 1;

        // Lưu lại lịch sử tự động gia hạn
        auction.autoExtendHistory.push({
          extendedAt: now,
          oldEndTime: new Date(newEndTime.getTime() - duration),
          newEndTime: newEndTime,
          triggeredByBidId: null,
        });

        console.log(
          `[BID SERVICE] Tự động gia hạn lần: ${auction.autoExtendCount}`
        );
        console.log(
          `[BID SERVICE] Thời gian kết thúc mới: ${auction.newEndTime}`
        );
      }
    }

    // Cập nhật auction
    auction.currentPrice = bidAmount;
    auction.winnerId = userId;
    auction.bidCount += 1;

    await auction.save();

    // 7. Tạo session để đảm bảo atomic operation
    const session = await Auction.startSession();
    session.startTransaction();

    try {
      // 7a. Tạo record bid mới
      const newBid = await Bid.create(
        [
          {
            auctionId,
            productId: auction.productId,
            bidderId,
            amount: bidAmount,
            isAuto: false,
          },
        ],
        { session }
      );

      // 8b. Update auction (chỉ update nếu giá vẫn còn hợp lệ - optimistic concurrency)
      const updated = await Auction.findOneAndUpdate(
        {
          _id: auctionId,
          currentPrice: { $lt: bidAmount },
          status: AUCTION_STATUS.ACTIVE,
        },
        [
          {
            $set: {
              currentPrice: bidAmount,
              currentHighestBidId: newBid[0]._id,
              currentHighestBidderId: bidderId,
              bidCount: { $add: ["$bidCount", 1] },

              // ★ Update phần tử cuối của autoExtendHistory nếu thỏa điều kiện
              autoExtendHistory: {
                $cond: [
                  {
                    $and: [
                      autoExtended, // biến boolean từ JS
                      { $gt: [{ $size: "$autoExtendHistory" }, 0] },
                    ],
                  },
                  {
                    // Nếu thỏa → ghi đè phần tử cuối
                    $concatArrays: [
                      {
                        $slice: [
                          "$autoExtendHistory",
                          { $subtract: [{ $size: "$autoExtendHistory" }, 1] },
                        ],
                      },
                      [
                        {
                          $mergeObjects: [
                            { $arrayElemAt: ["$autoExtendHistory", -1] },
                            { triggeredByBidId: newBid[0]._id },
                          ],
                        },
                      ],
                    ],
                  },
                  "$autoExtendHistory", // Nếu không thỏa → giữ nguyên
                ],
              },

              updatedAt: new Date(),
            },
          },
        ],
        { new: true, session }
      );

      if (!updated) {
        // Ai đó đặt giá cao hơn trước
        throw new AppError("Có người đặt giá cao hơn bạn rồi", 409);
      }

      // // 7c. Kiểm tra auto-extend
      // if (auction.autoExtendEnabled) {
      //   await this._checkAndExtendAuction(updated, session);
      // }

      // Commit transaction
      await session.commitTransaction();

      // Send Notifications (Fire and forget)
      (async () => {
          try {
              const [product, seller, bidder, prevBidder] = await Promise.all([
                  Product.findById(auction.productId),
                  User.findById(auction.sellerId),
                  User.findById(bidderId),
                  auction.currentHighestBidderId ? User.findById(auction.currentHighestBidderId) : null
              ]);

              const auctionUrl = `${process.env.FRONTEND_BASE_URL}/products/${auction.productId}`;

              // 1. Send to new bidder
              if (bidder && product) {
                   await sendBidSuccessNotification({
                      bidderEmail: bidder.email,
                      bidderName: bidder.fullName,
                      productTitle: product.title,
                      bidAmount: bidAmount,
                      currentPrice: bidAmount,
                      isHighestBidder: true
                  });
              }

              // 2. Send to seller
              if (seller && product && bidder) {
                  await sendPriceUpdatedNotification({
                      sellerEmail: seller.email,
                      sellerName: seller.fullName,
                      productTitle: product.title,
                      previousPrice: auction.currentPrice,
                      newPrice: bidAmount,
                      bidderName: bidder.fullName,
                      totalBids: updated.bidCount,
                      auctionUrl: auctionUrl,
                      auctionEndTime: updated.endAt || auction.endAt
                  });
              }

              // 3. Send to previous bidder
              if (prevBidder && prevBidder._id.toString() !== bidderId.toString() && product) {
                  await sendOutbidNotification({
                      previousBidderEmail: prevBidder.email,
                      previousBidderName: prevBidder.fullName,
                      productTitle: product.title,
                      yourBidAmount: auction.currentPrice, // The price they were holding
                      currentPrice: bidAmount,
                      productUrl: auctionUrl,
                      auctionEndTime: updated.endAt || auction.endAt
                  });
              }

          } catch (err) {
              console.error("Error sending bid notifications:", err);
          }
      })();

      return {
        success: true,
        currentPrice: updated.currentPrice,
        currentHighestBidderId: updated.currentHighestBidderId,
        bidCount: updated.bidCount,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Từ chối lượt ra giá của một bidder cho sản phẩm
   * Nếu bidder hiện là highest bidder, chuyển cho bidder thứ 2
   * @param {string} productId - ID sản phẩm
   * @param {string} bidderId - ID bidder bị từ chối
   * @param {string} reason - Lý do từ chối
   * @returns {Object} Thông tin rejection
   */
  async rejectBidder(productId, bidderId, reason = "") {
    // 1. Tìm cuộc đấu giá active cho sản phẩm
    const auction = await Auction.findOne({
      productId,
      status: AUCTION_STATUS.ACTIVE,
    });

    // 2. Nếu bidder này là highest bidder, cần chuyển sang bidder thứ 2
    if (auction && auction.currentHighestBidderId?.toString() === bidderId) {
      // Tìm bid cao thứ 2
      const secondBid = await Bid.findOne({
        auctionId: auction._id,
        bidderId: { $ne: bidderId },
      })
        .sort({ amount: -1 })
        .limit(1);

      if (secondBid) {
        // Update auction với highest bidder mới
        await Auction.updateOne(
          { _id: auction._id },
          {
            currentPrice: secondBid.amount,
            currentHighestBidId: secondBid._id,
            currentHighestBidderId: secondBid.bidderId,
            updatedAt: new Date(),
          }
        );
      } else {
        // Không có bid nào khác, reset auction
        await Auction.updateOne(
          { _id: auction._id },
          {
            currentPrice: auction.startPrice,
            currentHighestBidId: null,
            currentHighestBidderId: null,
            bidCount: 0,
            updatedAt: new Date(),
          }
        );
      }
    }

    // 3. Thêm bidder vào rejected list
    const rejection = await RejectedBidder.findOneAndUpdate(
      { productId, bidderId },
      { reason, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email notification to the rejected bidder
    const rejectedUser = await User.findById(bidderId);
    const product = await Product.findById(productId);
    const seller = await User.findById(product.sellerId);

    if (rejectedUser && product) {
        const productUrl = `${process.env.FRONTEND_BASE_URL}/products/${productId}`;
        await sendBidRejectedNotification({
            bidderEmail: rejectedUser.email,
            bidderName: rejectedUser.fullName,
            productTitle: product.title,
            sellerName: seller ? seller.fullName : 'Seller',
            reason: reason,
            homeUrl: process.env.FRONTEND_BASE_URL
        });
    }

    return rejection;
  }

  /**
   * Lấy lịch sử đặt giá của một cuộc đấu giá
   * @param {string} auctionId - ID cuộc đấu giá
   * @param {number} page - Trang (mặc định 1)
   * @param {number} limit - Số record mỗi trang (mặc định 20)
   * @returns {Object} { bids, total, page, pages }
   */
  async getBidHistory(auctionId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      Bid.find({ auctionId })
        .populate("bidderId", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bid.countDocuments({ auctionId }),
    ]);

    return {
      bids,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy tổng số bids của một bidder trong một cuộc đấu giá
   * @param {string} auctionId - ID cuộc đấu giá
   * @param {string} bidderId - ID bidder
   * @returns {number} Số bids
   */
  async getBidCountByBidder(auctionId, bidderId) {
    return await Bid.countDocuments({ auctionId, bidderId });
  }
}

export const bidService = new BidService();
