// SERVICE: Bid Service (Core Business Logic)

import {
  Auction,
  Bid,
  AutoBid,
  RejectedBidder,
  SystemSetting,
  User,
} from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { AUCTION_STATUS, ERROR_CODES } from "../lib/constants.js";

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

    console.log('[BID SERVICE] Place Auto Bid:', { auctionId, bidderId, maxAmount });

    if (isNaN(maxAmount)) {
      throw new AppError("Số tiền đặt giá không hợp lệ", 400);
    }

    // 1. Lấy thông tin auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new AppError("Cuộc đấu giá không tồn tại", 404);
    }

    // 2. Kiểm tra trạng thái
    if (auction.status !== AUCTION_STATUS.ACTIVE) {
      throw new AppError(
        "Cuộc đấu giá đã kết thúc hoặc không hoạt động",
        400,
        ERROR_CODES.AUCTION_NOT_ACTIVE
      );
    }

    const now = new Date();
    if (now > new Date(auction.endAt)) {
      throw new AppError(
        "Cuộc đấu giá đã kết thúc",
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
        "Bạn không được phép đặt giá cho sản phẩm này",
        403,
        ERROR_CODES.BIDDER_REJECTED
      );
    }

    // 4. Kiểm tra User & Rating
    const bidder = await User.findById(bidderId);
    if (!bidder) {
      throw new AppError("Người dùng không tồn tại", 404);
    }

    const ratingPercentage = bidder.ratingSummary?.score * 100 || 0;
    if (ratingPercentage < 80) {
      throw new AppError(
        `Điểm đánh giá của bạn (${ratingPercentage}%) phải >= 80% để đặt giá`,
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
        `Giá tối đa của bạn phải lớn hơn hoặc bằng ${minAllowed.toLocaleString("vi-VN")}đ`,
        400,
        ERROR_CODES.BID_TOO_LOW
      );
    }

    // 6. Lưu AutoBid (Update nếu đã tồn tại, Create nếu chưa)
    // Dùng session transaction cho an toàn
    const session = await Auction.startSession();
    session.startTransaction();

    try {
      await AutoBid.findOneAndUpdate(
        { auctionId, bidderId },
        {
          maxAmount,
          active: true,
          updatedAt: new Date()
        },
        { upsert: true, new: true, session }
      );

      // 7. Resolve Auction (Tính toán người thắng mới)
      const resolveResult = await this._resolveAuction(auction, session);

      await session.commitTransaction();

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
   */
  async _resolveAuction(auction, session) {
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
    // Nguyên tắc: Giá thắng = (Giá Max của người thứ 2) + Bước giá.
    // Nếu không có người thứ 2 => Giá = Giá khởi điểm (hoặc giá sàn hiện tại).

    let newPrice = auction.startPrice;

    if (secondBidder) {
      newPrice = secondBidder.maxAmount + auction.priceStep;

      // Nếu giá tính toán > Max của người nhất (do cộng step) -> Lấy đúng bằng Max của người nhất
      if (newPrice > highestBidder.maxAmount) {
        newPrice = highestBidder.maxAmount;
      }
    } else {
      // Chỉ có 1 người duy nhất
      // Nếu trước đó đã có giá (ví dụ 10M), và người này vào set Max=15M.
      // Giá vẫn giữ 10M hay tăng?
      // Theo yêu cầu: "Sản phẩm đang 10tr... nhập 15tr... Hệ thống sẽ không nhảy lên 15tr ngay."
      // Nghĩa là nếu chưa ai cạnh tranh, giá giữ nguyên mức thấp nhất có thể thắng.
      // Mức thấp nhất có thể thắng = Min(CurrentPrice, StartPrice).
      // Nhưng nếu CurrentPrice đang là giá của người cũ?
      // Trường hợp: A đang thắng 10M. A update Max lên 15M. Giá vẫn là 10M.
      // Trường hợp: Chưa ai bid. A bid Max 15M. Giá là StartPrice.

      // Nếu auction đang có currentPrice hợp lệ và người giữ đang là chính user này?
      // Ta cần đảm bảo giá không giảm xuống dưới startPrice.
      newPrice = Math.max(auction.currentPrice, auction.startPrice);

      // Tuy nhiên, nếu đấu giá mới bắt đầu (bidCount=0), newPrice = startPrice.
      if (auction.bidCount === 0) {
        newPrice = auction.startPrice;
      }
    }

    // 3. Kiểm tra xem có thay đổi gì không (Người thắng thay đổi HOẶC Giá thay đổi)
    // Lưu ý: Nếu A thắng với 10M, B vào bid max 9M. A vẫn thắng nhưng giá có thể tăng nếu 9M > giá cũ của A.
    // Nhưng logic AutoBid lấy Top 1 vs Top 2 đã xử lý việc này.

    // Nếu highestBidder hiện tại khác currentHighestBidder HOẶC giá mới khác giá hiện tại
    const isWinnerChanged = auction.currentHighestBidderId?.toString() !== highestBidder.bidderId.toString();
    const isPriceChanged = auction.currentPrice !== newPrice;

    if (!isWinnerChanged && !isPriceChanged) {
      // Không có gì thay đổi (ví dụ user update max amount nhưng vẫn đang thắng và giá ko đổi)
      return {
        success: true,
        currentPrice: auction.currentPrice,
        currentHighestBidderId: auction.currentHighestBidderId,
        bidCount: auction.bidCount
      };
    }

    // 3.1 Xử lý Auto Extend (Tự động gia hạn) -> Chỉ khi có bid mới thành công làm thay đổi cục diện?
    // Thông thường auto-extend xảy ra khi có "Valid Bid" near end time.
    // Việc hệ thống tự nhảy giá có tính là bid mới không? Có.

    let updateData = {
      currentPrice: newPrice,
      currentHighestBidderId: highestBidder.bidderId,
      $inc: { bidCount: 1 }, // Tăng bid count cho mỗi lần nhảy giá? Hay chỉ khi user action?
      // User yêu cầu: "Hệ thống tự động nhảy giá". Mỗi lần nhảy coi như 1 bid.
      updatedAt: new Date()
    };

    // Check Auto Extend
    const autoExtendEnabled = await SystemSetting.getSetting("autoExtendEnabled", true);
    let autoExtended = false;
    let newEndTime = auction.endAt;

    if (autoExtendEnabled) {
      const thresholdMinutes = await SystemSetting.getSetting("autoExtendThreshold", 5);
      const extendMinutes = await SystemSetting.getSetting("autoExtendDuration", 10);

      const now = new Date();
      const timeLeft = new Date(auction.endAt).getTime() - now.getTime();

      if (timeLeft > 0 && timeLeft <= thresholdMinutes * 60 * 1000) {
        newEndTime = new Date(new Date(auction.endAt).getTime() + extendMinutes * 60 * 1000);
        autoExtended = true;
      }
    }

    // 4. Tạo Bid record mới (Lịch sử nhảy giá)
    // Để hiển thị trong lịch sử đấu giá
    const newBidRecord = await Bid.create([{
      auctionId,
      productId: auction.productId,
      bidderId: highestBidder.bidderId,
      amount: newPrice,
      createdAt: new Date()
    }], { session });

    updateData.currentHighestBidId = newBidRecord[0]._id;

    if (autoExtended) {
      updateData.endAt = newEndTime;
      updateData.$inc.autoExtendCount = 1;
      updateData.$push = {
        autoExtendHistory: {
          extendedAt: new Date(),
          oldEndTime: auction.endAt,
          newEndTime: newEndTime,
          triggeredByBidId: newBidRecord[0]._id
        }
      };
    }

    // 5. Update Auction
    const updatedAuction = await Auction.findByIdAndUpdate(
      auctionId,
      updateData,
      { new: true, session }
    );

    console.log(`[BID SERVICE] Auction Resolved. Winner: ${highestBidder.bidderId}, Price: ${newPrice}`);

    return {
      success: true,
      currentPrice: updatedAuction.currentPrice,
      currentHighestBidderId: updatedAuction.currentHighestBidderId,
      bidCount: updatedAuction.bidCount
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
          invalidatedReason: `Seller rejected: ${reason}`
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
      console.error('[BID SERVICE] Reject Error:', error);
      throw error; // Ném lỗi để Controller xử lý
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
      console.log(`[BID SERVICE] Bidder ${bidderId} withdrawing bids for product ${productId}`);
      console.log(`[BID SERVICE] Reason: ${reason}`);

      // 1. Tìm cuộc đấu giá cho sản phẩm
      const auction = await Auction.findOne({ productId: productId }).session(session);
      if (!auction) {
        throw new AppError('Auction not found for this product', 404);
      }

      // Chỉ cho phép withdraw trong auction active
      if (auction.status !== AUCTION_STATUS.ACTIVE) {
        throw new AppError('Can only withdraw bids in active auctions', 400);
      }

      // 2. Kiểm tra bidder có bids nào không
      const bidCount = await Bid.countDocuments({
        auctionId: auction._id,
        bidderId: bidderId,
        isValid: true
      }).session(session);

      if (bidCount === 0) {
        throw new AppError('You have no active bids for this product', 400);
      }

      const previousWinnerId = auction.currentHighestBidderId ? auction.currentHighestBidderId.toString() : null;
      const isCurrentWinner = previousWinnerId === bidderId;

      console.log(`[BID SERVICE] Current winner: ${previousWinnerId}`);
      console.log(`[BID SERVICE] Is withdrawing bidder current winner? ${isCurrentWinner}`);

      // 3. Invalidate ALL bids của bidder
      const invalidatedResult = await Bid.updateMany(
        {
          auctionId: auction._id,
          bidderId: bidderId,
          isValid: true
        },
        {
          isValid: false,
          invalidatedAt: new Date(),
          invalidatedReason: reason
        },
        { session }
      );

      console.log(`[BID SERVICE] Invalidated ${invalidatedResult.modifiedCount} bids from withdrawing bidder`);

      let newWinner = null;
      let newPrice = auction.currentPrice;

      // 4. Nếu bidder đang là winner, tìm winner mới
      if (isCurrentWinner) {
        console.log(`[BID SERVICE] Finding new winner...`);

        // Tìm highest valid bid (không phải của withdrawing bidder)
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
          auction.currentHighestBidderId = newHighestBid.bidderId;
          auction.currentHighestBidId = newHighestBid._id;
          newWinner = newHighestBid.bidderId.toString();
          newPrice = newHighestBid.amount;

          console.log(`[BID SERVICE] New winner found: ${newWinner} with bid ${newPrice}`);
        } else {
          // Không còn bid hợp lệ nào → reset về giá khởi điểm
          auction.currentPrice = auction.startPrice;
          auction.currentHighestBidderId = null;
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

      // 6. Delete auto-bids của withdrawing bidder
      const AutoBid = (await import('../models/AutoBid.js')).default;
      const deletedAutoBids = await AutoBid.deleteMany({
        bidderId,
        productId
      }).session(session);

      console.log(`[BID SERVICE] Deleted ${deletedAutoBids.deletedCount} auto-bids`);

      // 7. Create audit log (optional)
      const AuditLog = (await import('../models/AuditLog.js')).default;
      await AuditLog.create([{
        user: bidderId,
        action: 'WITHDRAW_BID',
        resource: 'Auction',
        resourceId: auction._id,
        details: {
          productId,
          reason,
          wasCurrentWinner: isCurrentWinner,
          newWinnerId: newWinner,
          previousPrice: isCurrentWinner ? auction.currentPrice : null,
          newPrice
        }
      }], { session });

      await session.commitTransaction();

      return {
        withdrawal: {
          bidderId,
          reason,
          withdrawnAt: new Date()
        },
        auction: {
          auctionId: auction._id,
          currentPrice: auction.currentPrice,
          currentHighestBidderId: auction.currentHighestBidderId,
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
      console.error('[BID SERVICE] Error withdrawing bid:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const bidService = new BidService();
