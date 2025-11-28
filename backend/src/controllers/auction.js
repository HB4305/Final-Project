import { auctionService } from '../services/AuctionService.js';
import { AppError } from '../utils/errors.js';

/**
 * Controller tạo cuộc đấu giá cho sản phẩm
 * Chỉ seller chủ sản phẩm hoặc admin mới có quyền
 */
export const createAuction = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { startPrice, priceStep, startAt, endAt, buyNowPrice, autoExtendEnabled } = req.body;

    const auction = await auctionService.createAuction(productId, {
      startPrice,
      priceStep,
      startAt,
      endAt,
      buyNowPrice,
      autoExtendEnabled
    });

    res.status(201).json({
      status: 'success',
      message: 'Tạo cuộc đấu giá thành công',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy danh sách cuộc đấu giá sắp kết thúc
 */
export const getEndingSoonAuctions = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const auctions = await auctionService.getEndingSoonAuctions(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy danh sách cuộc đấu giá có nhiều bids nhất
 */
export const getMostBidsAuctions = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const auctions = await auctionService.getMostBidsAuctions(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy danh sách cuộc đấu giá có giá cao nhất
 */
export const getHighestPriceAuctions = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const auctions = await auctionService.getHighestPriceAuctions(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: { auctions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy chi tiết cuộc đấu giá
 */
export const getAuctionDetail = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const auction = await auctionService.getAuctionDetail(auctionId);

    res.status(200).json({
      status: 'success',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller kết thúc cuộc đấu giá
 * Thường được gọi bởi cron job
 */
export const endAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const result = await auctionService.endAuction(auctionId);

    res.status(200).json({
      status: 'success',
      message: 'Kết thúc cuộc đấu giá thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller hủy cuộc đấu giá
 */
export const cancelAuction = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { reason } = req.body;

    const auction = await auctionService.cancelAuction(auctionId, reason);

    res.status(200).json({
      status: 'success',
      message: 'Hủy cuộc đấu giá thành công',
      data: { auction }
    });
  } catch (error) {
    next(error);
  }
};
