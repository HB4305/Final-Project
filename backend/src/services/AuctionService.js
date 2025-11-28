// SERVICE: Auction Service

import { Auction, Product, Bid, Order } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import { AUCTION_STATUS, ORDER_STATUS } from '../lib/constants.js';

export class AuctionService {
  /**
   * Tạo cuộc đấu giá cho một sản phẩm
   * @param {string} productId - ID sản phẩm
   * @param {Object} auctionData - { startPrice, priceStep, startAt, endAt, buyNowPrice, autoExtendEnabled }
   * @returns {Object} Cuộc đấu giá mới được tạo
   */
  async createAuction(productId, auctionData) {
    // 1. Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Sản phẩm không tồn tại', 404);
    }

    // 2. Kiểm tra sản phẩm đã có cuộc đấu giá active chưa
    const existingAuction = await Auction.findOne({
      productId,
      status: { $in: [AUCTION_STATUS.SCHEDULED, AUCTION_STATUS.ACTIVE] }
    });
    if (existingAuction) {
      throw new AppError('Sản phẩm này đã có cuộc đấu giá đang hoạt động', 400);
    }

    // 3. Tạo auction mới
    const auction = new Auction({
      productId,
      sellerId: product.sellerId,
      startPrice: auctionData.startPrice,
      currentPrice: auctionData.startPrice,
      priceStep: auctionData.priceStep,
      startAt: new Date(auctionData.startAt),
      endAt: new Date(auctionData.endAt),
      buyNowPrice: auctionData.buyNowPrice || null,
      autoExtendEnabled: auctionData.autoExtendEnabled || false,
      status: AUCTION_STATUS.SCHEDULED
    });

    await auction.save();

    return auction;
  }

  /**
   * Cập nhật status cuộc đấu giá từ SCHEDULED sang ACTIVE
   * (Thường được gọi bởi cron job khi thời gian bắt đầu tới)
   * @param {string} auctionId - ID cuộc đấu giá
   */
  async activateAuction(auctionId) {
    const auction = await Auction.findByIdAndUpdate(
      auctionId,
      { status: AUCTION_STATUS.ACTIVE, updatedAt: new Date() },
      { new: true }
    );
    return auction;
  }

  /**
   * Kết thúc cuộc đấu giá
   * Tạo Order nếu có highest bidder
   * @param {string} auctionId - ID cuộc đấu giá
   * @returns {Object} Thông tin auction và order (nếu có)
   */
  async endAuction(auctionId) {
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new AppError('Cuộc đấu giá không tồn tại', 404);
    }

    // Đánh dấu auction là ended
    auction.status = AUCTION_STATUS.ENDED;
    await auction.save();

    let order = null;

    // Nếu có highest bidder, tạo Order
    if (auction.currentHighestBidderId) {
      order = new Order({
        auctionId: auction._id,
        productId: auction.productId,
        buyerId: auction.currentHighestBidderId,
        sellerId: auction.sellerId,
        finalPrice: auction.currentPrice,
        currency: 'VND',
        status: ORDER_STATUS.AWAITING_PAYMENT
      });
      await order.save();
    }

    return { auction, order };
  }

  /**
   * Lấy danh sách cuộc đấu giá đang hoạt động (sắp kết thúc)
   * @param {number} limit - Số lượng (mặc định 5)
   * @returns {Array} Danh sách cuộc đấu giá
   */
  async getEndingSoonAuctions(limit = 5) {
    const auctions = await Auction.find({
      status: AUCTION_STATUS.ACTIVE
    })
      .populate('productId', 'title primaryImageUrl')
      .populate('currentHighestBidderId', 'username')
      .sort({ endAt: 1 })
      .limit(limit);

    return auctions;
  }

  /**
   * Lấy danh sách cuộc đấu giá có nhiều bids nhất
   * @param {number} limit - Số lượng (mặc định 5)
   * @returns {Array} Danh sách cuộc đấu giá
   */
  async getMostBidsAuctions(limit = 5) {
    const auctions = await Auction.find({
      status: AUCTION_STATUS.ACTIVE
    })
      .populate('productId', 'title primaryImageUrl')
      .populate('currentHighestBidderId', 'username')
      .sort({ bidCount: -1 })
      .limit(limit);

    return auctions;
  }

  /**
   * Lấy danh sách cuộc đấu giá có giá cao nhất
   * @param {number} limit - Số lượng (mặc định 5)
   * @returns {Array} Danh sách cuộc đấu giá
   */
  async getHighestPriceAuctions(limit = 5) {
    const auctions = await Auction.find({
      status: AUCTION_STATUS.ACTIVE
    })
      .populate('productId', 'title primaryImageUrl')
      .populate('currentHighestBidderId', 'username')
      .sort({ currentPrice: -1 })
      .limit(limit);

    return auctions;
  }

  /**
   * Lấy thông tin chi tiết cuộc đấu giá
   * @param {string} auctionId - ID cuộc đấu giá
   * @returns {Object} Thông tin auction đầy đủ
   */
  async getAuctionDetail(auctionId) {
    const auction = await Auction.findById(auctionId)
      .populate('productId')
      .populate('sellerId', 'username email ratingSummary')
      .populate('currentHighestBidderId', 'username ratingSummary');

    if (!auction) {
      throw new AppError('Cuộc đấu giá không tồn tại', 404);
    }

    return auction;
  }

  /**
   * Hủy cuộc đấu giá
   * @param {string} auctionId - ID cuộc đấu giá
   * @param {string} reason - Lý do hủy
   */
  async cancelAuction(auctionId, reason = '') {
    const auction = await Auction.findByIdAndUpdate(
      auctionId,
      {
        status: AUCTION_STATUS.CANCELLED,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!auction) {
      throw new AppError('Cuộc đấu giá không tồn tại', 404);
    }

    // TODO: Gửi notification cho tất cả bidders
    return auction;
  }
}

export const auctionService = new AuctionService();
