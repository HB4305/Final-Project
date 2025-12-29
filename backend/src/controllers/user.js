// CONTROLLER: User Controller

import UpgradeRequest from '../models/UpgradeRequest.js';
import User from '../models/User.js'; 
import { userService } from "../services/UserService.js";


/**
 * Controller lấy rating summary của user
 */
export const getUserRatingSummary = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    const result = await userService.getUserRatingSummary(userId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy danh sách ratings chi tiết
 */
export const getUserRatings = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { page, limit, context } = req.query;

    const result = await userService.getUserRatings(userId, {
      page,
      limit,
      context,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy profile đầy đủ của user
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    const result = await userService.getUserProfile(userId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * API 2.6: Submit upgrade request (Bidder → Seller)
 * POST /api/users/upgrade-request
 * ============================================
 */
export const submitUpgradeRequest = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { reason, documents } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    if (reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Reason must not exceed 500 characters'
      });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has seller role
    if (user.roles.includes('seller')) {
      // Check if still valid (not expired)
      if (user.sellerExpiresAt && user.sellerExpiresAt > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'You already have seller privileges',
          data: {
            expiresAt: user.sellerExpiresAt
          }
        });
      }
      // If expired, allow to request again
    }

    // Check if user has pending request
    const pendingRequest = await UpgradeRequest.findOne({
      user: userId,
      status: 'pending'
    });

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending upgrade request',
        data: {
          requestId: pendingRequest._id,
          requestedAt: pendingRequest.requestedAt
        }
      });
    }

    // Create new upgrade request
    const upgradeRequest = new UpgradeRequest({
      user: userId,
      reason: reason.trim(),
      documents: documents || [],
      status: 'pending',
      requestedAt: new Date()
    });

    await upgradeRequest.save();

    res.status(201).json({
      success: true,
      message: 'Upgrade request submitted successfully. Please wait for admin approval.',
      data: {
        requestId: upgradeRequest._id,
        status: upgradeRequest.status,
        requestedAt: upgradeRequest.requestedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy danh sách upgrade requests
 * GET /api/users/upgrade-requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const getUpgradeRequests = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const upgradeRequests = await UpgradeRequest.find({
      user: userId
    });

    res.status(200).json({
      status: "success",
      success: true,
      message: 'Upgrade requests retrieved successfully',
      data: upgradeRequests.data
    });
  } catch (error) {
    console.log("[ERROR] getUpgradeRequests: ", error);
    next(error);
  }
};

/**
 * Controller chấp nhận upgrade request
 * PUT /api/users/upgrade-requests/:requestId/approve
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const approveUpgradeRequest = async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const upgradeRequest = await upgradeService.approveUpgradeRequest(requestId);
    res.status(200).json({
      status: "success",
      success: true,
      message: 'Upgrade request approved successfully',
      data: upgradeRequest.data
    });
  } catch (error) {
    console.log("[ERROR] approveUpgradeRequest: ", error);
    next(error);
  }
};

/**
 * Controller từ chối upgrade request
 * PUT /api/users/upgrade-requests/:requestId/reject
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const rejectUpgradeRequest = async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const upgradeRequest = await UpgradeRequest.findById(requestId);
    if (!upgradeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }
    upgradeRequest.status = 'rejected';
    await upgradeRequest.save();
    res.status(200).json({
      success: true,
      message: 'Upgrade request rejected successfully',
      data: upgradeRequest
    });
  } catch (error) {
    console.log("[ERROR] rejectUpgradeRequest: ", error);
    next(error);
  }
};

/**
 * Controller upload avatar (Lưu Base64 vào MongoDB)
 */
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh để upload'
      });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImageUrl: dataURI },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: {
        profileImageUrl: user.profileImageUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

