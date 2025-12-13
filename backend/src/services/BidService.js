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
    // ✅ Đảm bảo bidAmount là số
    bidAmount = Number(bidAmount);

    console.log('[BID SERVICE] Bid amount type:', typeof bidAmount);
    console.log('[BID SERVICE] Bid amount value:', bidAmount);

    if (isNaN(bidAmount)) {
      throw new AppError("Số tiền đặt giá không hợp lệ", 400);
    }

    // 1. Lấy thông tin auction
    console.log('[BID SERVICE] Auction ID:', auctionId); // ✅ Debug log

    if (!auctionId) {
      throw new AppError("Auction ID không được cung cấp", 400);
    }

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
    const now = new Date(); // ✅ Thêm biến now
    if (now > new Date(auction.endAt)) {
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

    // 4. Kiểm tra giá đặt phải cao hơn giá hiện tại + step
    const minBidAmount = auction.currentPrice + auction.priceStep;
    console.log('[BID SERVICE] Current price:', auction.currentPrice);
    console.log('[BID SERVICE] Price step:', auction.priceStep);
    console.log('[BID SERVICE] Min bid amount:', minBidAmount);
    console.log('[BID SERVICE] User bid amount:', bidAmount);

    if (bidAmount < minBidAmount) {
      throw new AppError(
        `Giá đặt phải lớn hơn hoặc bằng ${minBidAmount.toLocaleString("vi-VN")}đ`,
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
    let newEndTime = auction.endAt;

    if (autoExtendEnabled) {
      // ✅ Chuyển Date sang timestamp
      if (!auction.endAt) {
        throw new AppError("Cuộc đấu giá không có thời gian kết thúc", 500);
      }

      const auctionEndTime = auction.endAt instanceof Date ? auction.endAt : new Date(auction.endAt);
      const endTimeMs = auctionEndTime.getTime();
      const nowMs = now.getTime();
      const timeRemaining = endTimeMs - nowMs;

      const threshold = autoExtendThreshold * 60 * 1000;
      const duration = autoExtendDuration * 60 * 1000;

      const minutesLeft = Math.floor(timeRemaining / 1000 / 60);
      console.log(`[BID SERVICE] Thời gian còn lại ${minutesLeft} phút`);

      if (timeRemaining <= threshold && timeRemaining > 0) {
        console.log(
          `[BID SERVICE] Tự động gia hạn thêm: ${autoExtendDuration} phút`
        );

        newEndTime = new Date(auctionEndTime.getTime() + duration);
        autoExtended = true;

        // ✅ Chỉ push vào array, KHÔNG save
        auction.autoExtendHistory.push({
          extendedAt: now,
          oldEndTime: auction.endAt,
          newEndTime: newEndTime,
          triggeredByBidId: null,
        });

        console.log(`[BID SERVICE] Tự động gia hạn lần: ${(auction.autoExtendCount || 0) + 1}`);
        console.log(`[BID SERVICE] Thời gian kết thúc mới: ${newEndTime}`);
      }
    }

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
            createdAt: new Date(),
          },
        ],
        { session }
      );

      // ✅ Chuẩn bị dữ liệu update
      const updateData = {
        currentPrice: bidAmount,
        currentHighestBidId: newBid[0]._id,
        currentHighestBidderId: bidderId,
        $inc: { bidCount: 1 },
        updatedAt: new Date(),
      };

      // ✅ Nếu có auto-extend, thêm vào updateData
      if (autoExtended) {
        updateData.endAt = newEndTime;
        updateData.$inc.autoExtendCount = 1;
        updateData.$push = {
          autoExtendHistory: {
            extendedAt: now,
            oldEndTime: auction.endAt,
            newEndTime: newEndTime,
            triggeredByBidId: newBid[0]._id
          }
        };
      }

      // ✅ Sửa log để dùng giá gốc
      const originalPrice = await Auction.findById(auctionId).select('currentPrice').lean();

      console.log('[BID SERVICE] Attempting update with conditions:');
      console.log('  - auctionId:', auctionId);
      console.log('  - currentPrice < bidAmount:', `${originalPrice.currentPrice} < ${bidAmount} = ${originalPrice.currentPrice < bidAmount}`);

      const updated = await Auction.findOneAndUpdate(
        {
          _id: auctionId,
          currentPrice: { $lt: bidAmount },
          status: AUCTION_STATUS.ACTIVE,
        },
        updateData,
        { new: true, session }
      );

      console.log('[BID SERVICE] Update result:', updated ? 'SUCCESS' : 'FAILED');

      if (!updated) {
        // ✅ Debug: Lấy giá mới nhất để xem
        const freshAuction = await Auction.findById(auctionId).session(session);
        console.log('[BID SERVICE] Fresh auction price:', freshAuction.currentPrice);
        console.log('[BID SERVICE] User bid was:', bidAmount);

        throw new AppError(
          `Có người đặt giá cao hơn (${freshAuction.currentPrice.toLocaleString('vi-VN')}đ). Vui lòng đặt giá mới.`,
          409,
          ERROR_CODES.BID_TOO_LOW
        );
      }

      // // 7c. Kiểm tra auto-extend
      // if (auction.autoExtendEnabled) {
      //   await this._checkAndExtendAuction(updated, session);
      // }

      // Commit transaction
      await session.commitTransaction();

      const result = {
        success: true,
        currentPrice: updated.currentPrice,
        currentHighestBidderId: updated.currentHighestBidderId,
        bidCount: updated.bidCount,
      };

      console.log('[BID SERVICE] Returning result:', result);
      return result;
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
