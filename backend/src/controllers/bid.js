import { bidService } from "../services/BidService.js";
import { AppError } from "../utils/errors.js";

/**
 * Controller đặt giá cho cuộc đấu giá
 */
export const placeBid = async (req, res, next) => {
  try {
    const { auctionId, productId } = req.params;
    const { amount } = req.body;
    const bidderId = req.user._id;

    console.log("[CONTROLLER] Params:", { auctionId, productId }); // ✅ Debug
    console.log("[CONTROLLER] Body:", { amount }); // ✅ Debug

    let finalAuctionId = auctionId;

    if (productId) {
      const Auction = (await import("../models/Auction.js")).default;

      const auction = await Auction.findOne({
        productId,
        status: "active",
      });

      console.log("[CONTROLLER] Found auction:", auction?._id); // ✅ Debug

      if (!auction) {
        throw new AppError(
          "Active auction not found for this product",
          404,
          "AUCTION_NOT_FOUND"
        );
      }
      finalAuctionId = auction._id.toString();
    }

    console.log("[CONTROLLER] Final Auction ID:", finalAuctionId); // ✅ Debug

    const result = await bidService.placeBid(finalAuctionId, bidderId, amount);

    console.log(
      "[CONTROLLER] Bid placed successfully, sending response:",
      result
    );

    res.status(201).json({
      status: "success",
      message: "Bid placed successfully",
      data: result,
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
      status: "success",
      data: result,
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

    const rejection = await bidService.rejectBidder(
      productId,
      bidderId,
      reason
    );

    res.status(200).json({
      status: "success",
      message: "Từ chối lượt ra giá thành công",
      data: { rejection },
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
      status: "success",
      data: { bidCount: count },
    });
  } catch (error) {
    next(error);
  }
};
