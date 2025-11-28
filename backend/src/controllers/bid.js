import { bidService } from '../services/BidService.js';
import { AppError } from '../utils/errors.js';

/**
 * Controller đặt giá cho cuộc đấu giá
 */
export const placeBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const bidderId = req.user._id;

    const result = await bidService.placeBid(auctionId, bidderId, amount);

    res.status(201).json({
      status: 'success',
      message: 'Đặt giá thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy lịch sử đặt giá của cuộc đấu giá
 */
export const getBidHistory = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await bidService.getBidHistory(
      auctionId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller từ chối lượt ra giá của bidder
 * Chỉ seller chủ sản phẩm hoặc admin mới có quyền
 */
export const rejectBidder = async (req, res, next) => {
  try {
    const { productId, bidderId } = req.params;
    const { reason } = req.body;

    const rejection = await bidService.rejectBidder(productId, bidderId, reason);

    res.status(200).json({
      status: 'success',
      message: 'Từ chối lượt ra giá thành công',
      data: { rejection }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy số lượng bids của một bidder trong cuộc đấu giá
 */
export const getBidCount = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const bidderId = req.user._id;

    const count = await bidService.getBidCountByBidder(auctionId, bidderId);

    res.status(200).json({
      status: 'success',
      data: { bidCount: count }
    });
  } catch (error) {
    next(error);
  }
};
