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
     * Lấy cấu hình hệ thống (do admin quyết định)
     */
    const systemAutoExtendEnabled = await SystemSetting.getSetting(
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
    console.log(`  - System enabled: ${systemAutoExtendEnabled}`);
    console.log(`  - Auction enabled: ${auction.autoExtendEnabled}`);
    console.log(`  - Threshold: ${autoExtendThreshold} phút`);
    console.log(`  - Duration: ${autoExtendDuration} phút`);

    let autoExtended = false;
    let newEndTime = auction.endTime;

    // Chỉ gia hạn khi:
    // 1. Admin bật tính năng (systemAutoExtendEnabled = true)
    // 2. Seller enable cho auction này (auction.autoExtendEnabled = true)
    if (systemAutoExtendEnabled && auction.autoExtendEnabled) {
      // Tính thời gian còn lại
      const timeRemaining = auction.endTime - now;
      const threshold = autoExtendThreshold * 60 * 1000;
      const duration = autoExtendDuration * 60 * 1000;

      const minutesLeft = Math.floor(timeRemaining / 1000 / 60);
      console.log(`[BID SERVICE] Thời gian còn lại: ${minutesLeft} phút`);

      // Nếu thời gian còn lại <= threshold, tiến hành gia hạn
      if (timeRemaining <= threshold && timeRemaining > 0) {
        console.log(
          `[BID SERVICE] Tự động gia hạn thêm: ${autoExtendDuration} phút`
        );

        const oldEndTime = auction.endTime;
        newEndTime = new Date(auction.endTime.getTime() + duration);
        autoExtended = true;

        // Cập nhật auction
        auction.endTime = newEndTime;
        auction.autoExtendCount = (auction.autoExtendCount || 0) + 1;

        // Lưu lại lịch sử tự động gia hạn
        if (!auction.autoExtendHistory) {
          auction.autoExtendHistory = [];
        }
        auction.autoExtendHistory.push({
          extendedAt: now,
          oldEndTime: oldEndTime,
          newEndTime: newEndTime,
          triggeredByBidId: null, // Sẽ cập nhật sau khi tạo bid
        });

        console.log(
          `[BID SERVICE] Tự động gia hạn lần: ${auction.autoExtendCount}`
        );
        console.log(
          `[BID SERVICE] Thời gian kết thúc mới: ${newEndTime}`
        );
      }
    } else {
      if (!systemAutoExtendEnabled) {
        console.log(`[BID SERVICE] Tự động gia hạn đã bị tắt bởi admin`);
      }
      if (!auction.autoExtendEnabled) {
        console.log(`[BID SERVICE] Seller chưa enable tự động gia hạn cho auction này`);
      }
    }

    // Cập nhật auction trước (để có endTime mới nếu auto-extend)
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

      // 7b. Nếu có auto-extend, cập nhật triggeredByBidId trong history
      if (autoExtended && auction.autoExtendHistory.length > 0) {
        const lastHistoryIndex = auction.autoExtendHistory.length - 1;
        auction.autoExtendHistory[lastHistoryIndex].triggeredByBidId = newBid[0]._id;
        await auction.save({ session });
      }

      // Commit transaction
      await session.commitTransaction();

      return {
        success: true,
        bid: newBid[0],
        auction: {
          currentPrice: auction.currentPrice,
          winnerId: auction.winnerId,
          bidCount: auction.bidCount,
          endTime: auction.endTime,
          autoExtended,
          autoExtendCount: auction.autoExtendCount || 0
        }
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ============================================
   * API 3.3: Từ chối lượt ra giá của một bidder
   * ============================================
   * Nếu bidder hiện là highest bidder, chuyển cho bidder thứ 2
   * @param {string} productId - ID sản phẩm
   * @param {string} bidderId - ID bidder bị từ chối
   * @param {string} reason - Lý do từ chối
   * @param {string} sellerId - ID seller (để ghi audit log)
   * @returns {Object} Thông tin rejection với winner mới
   */
  async rejectBidder(productId, bidderId, reason = "", sellerId = null) {
    const session = await Auction.startSession();
    session.startTransaction();

    try {
      console.log(`[BID SERVICE] Rejecting bidder ${bidderId} for product ${productId}`);
      console.log(`[BID SERVICE] Reason: ${reason}`);

      // 2. Check if bidder already rejected (idempotent)
      const existingRejection = await RejectedBidder.findOne({
        product: productId,
        bidder: bidderId
      }).session(session);

      if (existingRejection) {
        await session.abortTransaction();
        throw new AppError('Bidder has already been rejected for this product', 400);
      }

      // 2. Tìm cuộc đấu giá cho sản phẩm
      const auction = await Auction.findOne({ product: productId }).session(session);
      if (!auction) {
        throw new AppError('Auction not found for this product', 404);
      }

      // Chỉ cho phép reject trong auction active
      if (auction.status !== AUCTION_STATUS.ACTIVE) {
        throw new AppError('Can only reject bidders in active auctions', 400);
      }

      const previousWinnerId = auction.winnerId ? auction.winnerId.toString() : null;
      const isCurrentWinner = previousWinnerId === bidderId;

      console.log(`[BID SERVICE] Current winner: ${previousWinnerId}`);
      console.log(`[BID SERVICE] Is rejected bidder current winner? ${isCurrentWinner}`);

      // 3. Invalidate ALL bids của rejected bidder
      const invalidatedResult = await Bid.updateMany(
        { 
          auctionId: auction._id,
          bidderId: bidderId,
          isValid: true
        },
        { 
          isValid: false,
          invalidatedAt: new Date(),
          invalidatedReason: `Seller rejected bidder: ${reason}`
        },
        { session }
      );

      console.log(`[BID SERVICE] Invalidated ${invalidatedResult.modifiedCount} bids from rejected bidder`);

      let newWinner = null;
      let newPrice = auction.currentPrice;

      // 4. Nếu bidder bị reject đang là winner, tìm winner mới
      if (isCurrentWinner) {
        console.log(`[BID SERVICE] Finding new winner...`);

        // Tìm highest valid bid (không phải của rejected bidder)
        const newHighestBid = await Bid.findOne({
          auctionId: auction._id,
          bidderId: { $ne: bidderId },
          isValid: true
        })
        .sort({ amount: -1, createdAt: -1 })
        .session(session);

        if (newHighestBid) {
          // Có winner mới
          auction.currentPrice = newHighestBid.amount;
          auction.winnerId = newHighestBid.bidderId;
          auction.currentHighestBidId = newHighestBid._id;
          newWinner = newHighestBid.bidderId.toString();
          newPrice = newHighestBid.amount;

          console.log(`[BID SERVICE] New winner found: ${newWinner} with bid ${newPrice}`);
        } else {
          // Không còn bid hợp lệ nào → reset về giá khởi điểm
          auction.currentPrice = auction.startPrice;
          auction.winnerId = null;
          auction.currentHighestBidId = null;
          newPrice = auction.startPrice;

          console.log(`[BID SERVICE] No valid bids left, reset to start price ${newPrice}`);
        }
      }

      // 5. Recalculate bidCount (chỉ đếm valid bids)
      const validBidCount = await Bid.countDocuments({
        auctionId: auction._id,
        isValid: true
      }).session(session);

      auction.bidCount = validBidCount;
      auction.updatedAt = new Date();
      await auction.save({ session });

      console.log(`[BID SERVICE] Updated auction bidCount to ${validBidCount}`);

      // 6. Delete auto-bids của rejected bidder
      const AutoBid = (await import('../models/AutoBid.js')).default;
      const deletedAutoBids = await AutoBid.deleteMany({
        bidderId,
        productId
      }).session(session);

      console.log(`[BID SERVICE] Deleted ${deletedAutoBids.deletedCount} auto-bids`);

      // 7. Create rejection record
      const rejection = new RejectedBidder({
        product: productId,
        bidder: bidderId,
        rejectedBy: sellerId,
        reason,
        rejectedAt: new Date()
      });
      await rejection.save({ session });

      // 8. Create audit log (optional)
      const AuditLog = (await import('../models/AuditLog.js')).default;
      await AuditLog.create([{
        user: sellerId,
        action: 'REJECT_BIDDER',
        resource: 'Auction',
        resourceId: auction._id,
        details: {
          productId,
          rejectedBidderId: bidderId,
          reason,
          wasCurrentWinner: isCurrentWinner,
          newWinnerId: newWinner,
          previousPrice: previousWinnerId === bidderId ? auction.currentPrice : null,
          newPrice
        }
      }], { session });

      await session.commitTransaction();

      return {
        rejection: {
          bidderId,
          reason,
          rejectedAt: rejection.rejectedAt
        },
        auction: {
          auctionId: auction._id,
          currentPrice: auction.currentPrice,
          winnerId: auction.winnerId,
          bidCount: auction.bidCount
        },
        previousWinner: previousWinnerId,
        newWinner,
        winnerChanged: isCurrentWinner,
        invalidatedBidsCount: invalidatedResult.modifiedCount,
        deletedAutoBidsCount: deletedAutoBids.deletedCount
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('[BID SERVICE] Error rejecting bidder:', error);
      throw error;
    } finally {
      session.endSession();
    }
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
