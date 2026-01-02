// SERVICE: Bid Service (Core Business Logic)

import {
  Auction,
  Bid,
  AutoBid,
  RejectedBidder,
  SystemSetting,
  User,
  Product
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
   * Đặt giá tự động (Auto Bid) cho sản phẩm
   * User thiết lập giá trần (maxAmount), hệ thống tự động bid
   * @param {string} auctionId - ID cuộc đấu giá
   * @param {string} bidderId - ID người đặt giá
   * @param {number} maxAmount - Mức giá tối đa user sẵn sàng trả
   * @returns {Object} { success, currentPrice, currentHighestBidderId }
   */
  async placeBid(auctionId, bidderId, maxAmount) {
    // ✅ Đảm bảo maxAmount là số
    maxAmount = Number(maxAmount);

    console.log("[BID SERVICE] Place Auto Bid:", {
      auctionId,
      bidderId,
      maxAmount,
    });

    if (isNaN(maxAmount)) {
      throw new AppError("Invalid bid amount", 400);
    }

    // 1. Lấy thông tin auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new AppError("Auction not found", 404);
    }

    // 2. Kiểm tra trạng thái
    if (auction.status !== AUCTION_STATUS.ACTIVE) {
      throw new AppError(
        "Auction has ended or is not active",
        400,
        ERROR_CODES.AUCTION_NOT_ACTIVE
      );
    }

    const now = new Date();
    if (now > new Date(auction.endAt)) {
      throw new AppError(
        "Auction has ended",
        400,
        ERROR_CODES.AUCTION_NOT_ACTIVE
      );
    }

    // 3. Kiểm tra Rejected Bidder
    const isRejected = await RejectedBidder.findOne({
      productId: auction.productId,
      bidderId,
    });
    if (isRejected) {
      throw new AppError(
        "You are not allowed to bid on this product",
        403,
        ERROR_CODES.BIDDER_REJECTED
      );
    }

    // 4. Kiểm tra User & Rating
    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new AppError("User not found", 404);
    }

    const ratingPercentage = bidder.ratingSummary?.score * 100 || 0;
    if (ratingPercentage < 80) {
      throw new AppError(
        `Your rating (${ratingPercentage}%) must be >= 80% to bid`,
        403,
        ERROR_CODES.RATING_TOO_LOW
      );
    }

    // 5. Validate Max Amount
    // Giá trần phải >= Giá hiện tại + Bước giá (nếu người khác đang giữ)
    // Hoặc >= Giá khởi điểm (nếu chưa ai bid)
    // Tuy nhiên, logic đúng là: User muốn trả TỐI ĐA bao nhiêu.
    // Nếu maxAmount < currentPrice, chắc chắn fail.
    // Nếu maxAmount < currentWinningBid (ẩn), sẽ thua ngay lập tức nhưng vẫn cho phép set?
    // Để đơn giản và tránh spam: Yêu cầu maxAmount >= Min Bid hợp lệ hiện tại.

    const minRequired = auction.currentPrice + auction.priceStep;
    // Nếu chưa có ai bid (currentPrice có thể là startPrice), thì min là startPrice?
    // Giả sử currentPrice luôn được init bằng startPrice khi tạo auction.

    // Logic: Nếu currentPrice = startPrice và bidCount = 0, thì được phép bid >= startPrice.
    // Nếu đã có bid, phải >= current + step.
    let minAllowed = minRequired;
    if (auction.bidCount === 0) {
      minAllowed = auction.startPrice;
    }

    if (maxAmount < minAllowed) {
      throw new AppError(
        `Your max bid must be greater than or equal to ${minAllowed.toLocaleString(
          "vi-VN"
        )}đ`,
        400,
        ERROR_CODES.BID_TOO_LOW
      );
    }

    // 6. Lưu AutoBid (Update nếu đã tồn tại, Create nếu chưa)
    // Dùng session transaction cho an toàn
    const session = await Auction.startSession();
    session.startTransaction();

    try {
      // Check existing bid to preserve priority
      const existingBid = await AutoBid.findOne({ auctionId, bidderId }).session(session);
      let updateFields = {
        maxAmount,
        active: true
      };

      // Only update timestamp if amount is DIFFERENT.
      // If amount is same, keep original timestamp to preserve "First Come First Serve" priority.
      if (!existingBid || existingBid.maxAmount !== maxAmount) {
        updateFields.updatedAt = new Date();
      }

      await AutoBid.findOneAndUpdate(
        { auctionId, bidderId },
        {
          maxAmount,
          active: true,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, session }
      );

      // 7. Resolve Auction (Tính toán người thắng mới)
      const resolveResult = await this._resolveAuction(auction, session, bidderId);

      await session.commitTransaction();

      // --- Send Notifications ---
      try {
        const product = await Product.findById(auction.productId);
        const seller = await User.findById(product.sellerId);
        const bidder = await User.findById(bidderId);

        // 1. Send Bid Success to the current bidder
        const isHighest = resolveResult.currentHighestBidderId?.toString() === bidderId.toString();
        await sendBidSuccessNotification({
          bidderEmail: bidder.email,
          bidderName: bidder.fullName,
          productTitle: product.title,
          bidAmount: maxAmount,
          currentPrice: resolveResult.currentPrice,
          isHighestBidder: isHighest
        });

        // 2. Send Price Updated to Seller
        if (resolveResult.currentPrice !== auction.currentPrice) {
          await sendPriceUpdatedNotification({
            sellerEmail: seller.email,
            sellerName: seller.fullName,
            productTitle: product.title,
            previousPrice: auction.currentPrice,
            newPrice: resolveResult.currentPrice,
            bidderName: bidder.fullName,
            totalBids: resolveResult.bidCount,
            auctionUrl: `${process.env.FRONTEND_URL}/product/${auction.productId}`,
            auctionEndTime: resolveResult.endAt || auction.endAt
          });
        }

        // 3. Send Outbid Notification to previous winner
        const previousWinnerId = auction.currentHighestBidderId;
        if (previousWinnerId && previousWinnerId.toString() !== resolveResult.currentHighestBidderId?.toString()) {
          if (previousWinnerId.toString() !== bidderId.toString()) {
            const previousWinner = await User.findById(previousWinnerId);
            const prevBid = await AutoBid.findOne({ auctionId: auction._id, bidderId: previousWinnerId });
            const yourBidAmount = prevBid ? prevBid.maxAmount : auction.currentPrice;

            if (previousWinner) {
              await sendOutbidNotification({
                previousBidderEmail: previousWinner.email,
                previousBidderName: previousWinner.fullName,
                productTitle: product.title,
                yourBidAmount: yourBidAmount,
                currentPrice: resolveResult.currentPrice,
                productUrl: `${process.env.FRONTEND_URL}/product/${auction.productId}`,
                auctionEndTime: resolveResult.endAt || auction.endAt
              });
            }
          }
        }
      } catch (err) {
        console.error("[BID SERVICE] Error sending notifications:", err);
      }

      return resolveResult;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Logic cốt lõi: Tính toán lại giá và người thắng dựa trên danh sách AutoBid
   * @param {Object} auction - Auction document
   * @param {Object} session - Mongoose session
   * @param {string} triggeringBidderId - ID của bidder vừa thực hiện hành động (để ghi log nếu thua)
   */
  async _resolveAuction(auction, session, triggeringBidderId = null) {
    const auctionId = auction._id;

    // 1. Lấy tất cả AutoBid active, sort giảm dần theo maxAmount, sau đó tăng dần theo time (ưu tiên người đến trước)
    const autoBids = await AutoBid.find({ auctionId, active: true })
      .sort({ maxAmount: -1, updatedAt: 1 })
      .session(session);

    if (autoBids.length === 0) {
      return { success: true, message: "No bids" };
    }

    const highestBidder = autoBids[0];
    const secondBidder = autoBids[1]; // Có thể undefined nếu chỉ có 1 người

    // 2. Tính giá trần mới (New Price)
    let newPrice = auction.startPrice;

    // Biến để tracking xem người thắng có thay đổi không
    const isWinnerChanged =
      !auction.currentHighestBidderId ||
      auction.currentHighestBidderId.toString() !==
      highestBidder.bidderId.toString();

    if (secondBidder) {
      // Logic "Giá vừa đủ thắng":
      // 1. Nếu người nhất thay đổi (Người mới vào beat người cũ):
      //    Cần beat người thứ 2 một bước giá (hoặc khớp Max nếu không đủ bước).
      // 2. Nếu người nhất không đổi (Người cũ Defend):
      //    Chỉ cần Match giá của người thứ 2 là thắng (do Time ưu tiên).

      if (isWinnerChanged) {
        // Trường hợp người mới vượt lên -> Phải cộng step để thắng
        newPrice = secondBidder.maxAmount + auction.priceStep;
      } else {
        // Trường hợp người cũ giữ vững -> Chỉ cần match giá người thứ 2
        newPrice = secondBidder.maxAmount;
      }

      // Cap giá không vượt quá Max của người thắng
      if (newPrice > highestBidder.maxAmount) {
        newPrice = highestBidder.maxAmount;
      }
    } else {
      // Chỉ có 1 người duy nhất
      // Nếu là bid đầu tiên -> StartPrice
      if (auction.bidCount === 0) {
        newPrice = auction.startPrice;
      } else {
        // Nếu đã có giá rồi -> Giá phải ít nhất là giá hiện tại (không giảm giá).
        newPrice = Math.max(auction.currentPrice, auction.startPrice);
      }
    }

    // 3. Chuẩn bị danh sách Bids để tạo (Lịch sử đấu giá)
    // Chúng ta muốn trong lịch sử hiện:
    // User B (Thua) - 10.8M
    // User A (Thắng) - 10.8M (Defend)
    const bidsToCreate = [];
    const now = new Date();

    // 3.1 Ghi nhận bid của người thua (Người vừa vào bid nhưng ko thắng)
    // Chỉ ghi nhận nếu triggeringBidderId tồn tại VÀ không phải là người thắng
    if (
      triggeringBidderId &&
      triggeringBidderId.toString() !== highestBidder.bidderId.toString()
    ) {
      // Tìm thông tin bid của người này trong autoBids (hoặc query lại nếu cần)
      // Trong logic này, người này chắc chắn nằm trong list autoBids (vì vừa placeBid/update)
      // Nhưng họ có thể là secondBidder, hoặc thứ 3, 4...
      const triggeringAutoBid = autoBids.find(
        (b) => b.bidderId.toString() === triggeringBidderId.toString()
      );

      if (triggeringAutoBid) {
        // Ghi nhận mức giá họ đã bid (Max Amount của họ)
        // Tuy nhiên, để lịch sử đẹp, ta nên ghi nhận mức giá họ "đẩy" lên.
        // Nhưng đơn giản nhất là ghi Max Amount của họ (như User yêu cầu: #2 10.8M)
        bidsToCreate.push({
          auctionId,
          productId: auction.productId,
          bidderId: triggeringBidderId,
          amount: triggeringAutoBid.maxAmount,
          isAuto: true,
          isValid: true,
          createdAt: new Date(now.getTime() - 100), // Trick: create earlier than winner
        });
      }
    }

    // 3.2 Ghi nhận bid của người thắng (Nếu giá thay đổi HOẶC người thắng thay đổi HOẶC có người vừa challenge)
    // Luôn ghi nhận bid mới của người thắng nếu có sự kiện xảy ra để cập nhật Price
    // Tuy nhiên, tránh spam history nếu không có gì thay đổi thực sự
    // Nhưng ở đây, nếu có triggeringBidderId (có người tác động), ta nên log lại phản ứng của winner.

    const shouldLogWinnerBid =
      isWinnerChanged ||
      auction.currentPrice !== newPrice ||
      (triggeringBidderId &&
        triggeringBidderId.toString() !== highestBidder.bidderId.toString());

    let winnerBidId = null;

    if (shouldLogWinnerBid) {
      const winnerBid = {
        auctionId,
        productId: auction.productId,
        bidderId: highestBidder.bidderId,
        amount: newPrice,
        isAuto: true,
        isValid: true,
        createdAt: now,
      };
      bidsToCreate.push(winnerBid);
    }

    // Insert Bids
    if (bidsToCreate.length > 0) {
      // Fix: Khi create nhiều docs với session, Mongoose yêu cầu ordered: true
      const createdBids = await Bid.create(bidsToCreate, {
        session,
        ordered: true,
      });
      // Lấy ID của bid thắng (là bid cuối cùng trong mảng do ta push sau)
      const lastBid = createdBids[createdBids.length - 1];
      if (lastBid.bidderId.toString() === highestBidder.bidderId.toString()) {
        winnerBidId = lastBid._id;
      }
    }

    // 4. Update Auction Data
    // Nếu không có gì thay đổi về giá/người thắng và không có bid mới, có thể skip update?
    // Nhưng bidCount cần tăng.
    // Nếu có bidsToCreate -> có bid mới -> tăng bidCount.

    let updateData = {};
    let shouldUpdate = false;

    if (auction.currentPrice !== newPrice) {
      updateData.currentPrice = newPrice;
      shouldUpdate = true;
    }
    if (
      auction.currentHighestBidderId?.toString() !==
      highestBidder.bidderId.toString()
    ) {
      updateData.currentHighestBidderId = highestBidder.bidderId;
      shouldUpdate = true;
    }
    if (winnerBidId) {
      updateData.currentHighestBidId = winnerBidId;
      shouldUpdate = true;
    }

    if (bidsToCreate.length > 0) {
      // Tăng bid count theo số lượng bid records tạo ra
      // Hoặc chỉ tính mỗi lần user action là 1 bid?
      // Hệ thống đấu giá thường tính số lần giá thay đổi hoặc số lần đặt.
      // Ở đây ta cộng số record tạo ra.
      updateData.$inc = { bidCount: bidsToCreate.length };
      updateData.updatedAt = new Date();
      shouldUpdate = true;
    }

    // 4.1 Auto Extend Logic
    const autoExtendEnabled = await SystemSetting.getSetting(
      "autoExtendEnabled",
      true
    );
    let autoExtended = false;
    let newEndTime = auction.endAt;

    if (autoExtendEnabled && bidsToCreate.length > 0) {
      const thresholdMinutes = await SystemSetting.getSetting(
        "autoExtendThreshold",
        5
      );
      const extendMinutes = await SystemSetting.getSetting(
        "autoExtendDuration",
        10
      );

      const timeLeft = new Date(auction.endAt).getTime() - now.getTime();

      if (timeLeft > 0 && timeLeft <= thresholdMinutes * 60 * 1000) {
        newEndTime = new Date(
          new Date(auction.endAt).getTime() + extendMinutes * 60 * 1000
        );
        autoExtended = true;

        updateData.endAt = newEndTime;
        if (!updateData.$inc) updateData.$inc = {};
        updateData.$inc.autoExtendCount = 1;

        if (!updateData.$push) updateData.$push = {};
        updateData.$push.autoExtendHistory = {
          extendedAt: new Date(),
          oldEndTime: auction.endAt,
          newEndTime: newEndTime,
          triggeredByBidId: winnerBidId, // Gắn với bid chiến thắng
        };
        shouldUpdate = true;
      }
    }

    // Perform Update
    let updatedAuction = auction;
    if (shouldUpdate) {
      updatedAuction = await Auction.findByIdAndUpdate(auctionId, updateData, {
        new: true,
        session,
      });
    }

    console.log(
      `[BID SERVICE] Auction Resolved. Winner: ${highestBidder.bidderId}, Price: ${newPrice}, BidsCreated: ${bidsToCreate.length}`
    );

    return {
      success: true,
      currentPrice: updatedAuction.currentPrice,
      currentHighestBidderId: updatedAuction.currentHighestBidderId,
      bidCount: updatedAuction.bidCount,
      endAt: updatedAuction.endAt,
    };
  }

  /**
   * Từ chối lượt ra giá của một bidder cho sản phẩm
   * Nếu bidder hiện là highest bidder, cần recalculate lại từ AutoBid
   */
  async rejectBidder(productId, bidderId, sellerId, reason = "") {
    const session = await Auction.startSession();
    session.startTransaction();

    try {
      // 1. Lấy thông tin auction
      const auction = await Auction.findOne({ productId }).session(session);
      if (!auction) throw new AppError("Auction not found", 404);

      // 2. Chặn bidder (Lưu vào danh sách đen)
      await RejectedBidder.findOneAndUpdate(
        { productId, bidderId },
        { reason, rejectedBy: sellerId, createdAt: new Date() },
        { upsert: true, session }
      );

      // 3. Vô hiệu hóa AutoBid
      await AutoBid.updateMany(
        { auctionId: auction._id, bidderId },
        { active: false },
        { session }
      );

      // 4. Vô hiệu hóa các Bid cũ trong lịch sử
      await Bid.updateMany(
        { auctionId: auction._id, bidderId, isValid: true },
        {
          isValid: false,
          invalidatedAt: new Date(),
          invalidatedReason: `Seller rejected: ${reason}`,
        },
        { session }
      );

      // 5. Quan trọng: Tính toán lại người thắng cuộc bằng logic cốt lõi
      // Sử dụng hàm _resolveAuction đã viết sẵn để đảm bảo tính nhất quán
      const result = await this._resolveAuction(auction, session);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      console.error("[BID SERVICE] Reject Error:", error);
      throw error; // Ném lỗi để Controller xử lý
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
      const productUrl = `${process.env.FRONTEND_URL}/product/${productId}`;
      await sendBidRejectedNotification({
        bidderEmail: rejectedUser.email,
        bidderName: rejectedUser.fullName,
        productTitle: product.title,
        sellerName: seller ? seller.fullName : 'Seller',
        reason: reason,
        homeUrl: process.env.FRONTEND_URL
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

  /**
   * ============================================
   * API 3.3: Bidder tự rút lại bid của mình
   * ============================================
   * Bidder có thể tự rút lại tất cả bids của mình
   * Nếu bidder hiện là highest bidder, chuyển cho bidder thứ 2
   * @param {string} productId - ID sản phẩm
   * @param {string} bidderId - ID bidder muốn rút bid
   * @param {string} reason - Lý do rút bid
   * @returns {Object} Thông tin withdrawal với winner mới
   */
  async withdrawBid(productId, bidderId, reason = "Bidder withdrew bid") {
    const session = await Auction.startSession();
    session.startTransaction();

    try {
      console.log(
        `[BID SERVICE] Bidder ${bidderId} withdrawing bids for product ${productId}`
      );
      console.log(`[BID SERVICE] Reason: ${reason}`);

      // 1. Tìm cuộc đấu giá cho sản phẩm
      const auction = await Auction.findOne({ productId: productId }).session(
        session
      );
      if (!auction) {
        throw new AppError("Auction not found for this product", 404);
      }

      // Chỉ cho phép withdraw trong auction active
      if (auction.status !== AUCTION_STATUS.ACTIVE) {
        throw new AppError("Can only withdraw bids in active auctions", 400);
      }

      // 2. Kiểm tra bidder có bids nào không
      const bidCount = await Bid.countDocuments({
        auctionId: auction._id,
        bidderId: bidderId,
        isValid: true,
      }).session(session);

      if (bidCount === 0) {
        throw new AppError("You have no active bids for this product", 400);
      }

      const previousWinnerId = auction.currentHighestBidderId
        ? auction.currentHighestBidderId.toString()
        : null;
      const isCurrentWinner = previousWinnerId === bidderId;

      console.log(`[BID SERVICE] Current winner: ${previousWinnerId}`);
      console.log(
        `[BID SERVICE] Is withdrawing bidder current winner? ${isCurrentWinner}`
      );

      // 3. Invalidate ALL bids của bidder
      const invalidatedResult = await Bid.updateMany(
        {
          auctionId: auction._id,
          bidderId: bidderId,
          isValid: true,
        },
        {
          isValid: false,
          invalidatedAt: new Date(),
          invalidatedReason: reason,
        },
        { session }
      );

      console.log(
        `[BID SERVICE] Invalidated ${invalidatedResult.modifiedCount} bids from withdrawing bidder`
      );

      let newWinner = null;
      let newPrice = auction.currentPrice;

      // 4. Nếu bidder đang là winner, tìm winner mới
      if (isCurrentWinner) {
        console.log(`[BID SERVICE] Finding new winner...`);

        // Tìm highest valid bid (không phải của withdrawing bidder)
        const newHighestBid = await Bid.findOne({
          auctionId: auction._id,
          bidderId: { $ne: bidderId },
          isValid: true,
        })
          .sort({ amount: -1, createdAt: -1 })
          .session(session);

        if (newHighestBid) {
          // Có winner mới
          auction.currentPrice = newHighestBid.amount;
          auction.currentHighestBidderId = newHighestBid.bidderId;
          auction.currentHighestBidId = newHighestBid._id;
          newWinner = newHighestBid.bidderId.toString();
          newPrice = newHighestBid.amount;

          console.log(
            `[BID SERVICE] New winner found: ${newWinner} with bid ${newPrice}`
          );
        } else {
          // Không còn bid hợp lệ nào → reset về giá khởi điểm
          auction.currentPrice = auction.startPrice;
          auction.currentHighestBidderId = null;
          auction.currentHighestBidId = null;
          newPrice = auction.startPrice;

          console.log(
            `[BID SERVICE] No valid bids left, reset to start price ${newPrice}`
          );
        }
      }

      // 5. Recalculate bidCount (chỉ đếm valid bids)
      const validBidCount = await Bid.countDocuments({
        auctionId: auction._id,
        isValid: true,
      }).session(session);

      auction.bidCount = validBidCount;
      auction.updatedAt = new Date();
      await auction.save({ session });

      console.log(`[BID SERVICE] Updated auction bidCount to ${validBidCount}`);

      // 6. Delete auto-bids của withdrawing bidder
      const AutoBid = (await import("../models/AutoBid.js")).default;
      const deletedAutoBids = await AutoBid.deleteMany({
        bidderId,
        productId,
      }).session(session);

      console.log(
        `[BID SERVICE] Deleted ${deletedAutoBids.deletedCount} auto-bids`
      );

      // 7. Create audit log (optional)
      const AuditLog = (await import("../models/AuditLog.js")).default;
      await AuditLog.create(
        [
          {
            user: bidderId,
            action: "WITHDRAW_BID",
            resource: "Auction",
            resourceId: auction._id,
            details: {
              productId,
              reason,
              wasCurrentWinner: isCurrentWinner,
              newWinnerId: newWinner,
              previousPrice: isCurrentWinner ? auction.currentPrice : null,
              newPrice,
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        withdrawal: {
          bidderId,
          reason,
          withdrawnAt: new Date(),
        },
        auction: {
          auctionId: auction._id,
          currentPrice: auction.currentPrice,
          currentHighestBidderId: auction.currentHighestBidderId,
          bidCount: auction.bidCount,
        },
        previousWinner: previousWinnerId,
        newWinner,
        winnerChanged: isCurrentWinner,
        invalidatedBidsCount: invalidatedResult.modifiedCount,
        deletedAutoBidsCount: deletedAutoBids.deletedCount,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("[BID SERVICE] Error withdrawing bid:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const bidService = new BidService();
