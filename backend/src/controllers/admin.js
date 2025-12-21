import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import Watchlist from '../models/Watchlist.js';
import Question from '../models/Question.js';
import UpgradeRequest from '../models/UpgradeRequest.js';

/**
 * Get auto-extend settings
 * GET /api/admin/settings/auto-extend
 */
export const getAutoExtendSettings = async (req, res, next) => {
  try {
    const enabled = await SystemSetting.getSetting('autoExtendEnabled', true);
    const threshold = await SystemSetting.getSetting('autoExtendThreshold', 5);
    const duration = await SystemSetting.getSetting('autoExtendDuration', 10);

    res.json({
      success: true,
      data: {
        autoExtendEnabled: enabled,
        autoExtendThreshold: threshold,
        autoExtendDuration: duration
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update auto-extend settings
 * PUT /api/admin/settings/auto-extend
 */
export const updateAutoExtendSettings = async (req, res, next) => {
  try {
    const { autoExtendEnabled, autoExtendThreshold, autoExtendDuration } = req.body;
    const adminId = req.user._id;

    // Validate inputs
    if (typeof autoExtendEnabled !== 'undefined' && typeof autoExtendEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoExtendEnabled must be a boolean'
      });
    }

    if (autoExtendThreshold !== undefined) {
      if (typeof autoExtendThreshold !== 'number' || autoExtendThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'autoExtendThreshold must be a positive number'
        });
      }
    }

    if (autoExtendDuration !== undefined) {
      if (typeof autoExtendDuration !== 'number' || autoExtendDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'autoExtendDuration must be a positive number'
        });
      }
    }

    // Update settings
    const updates = {};
    if (typeof autoExtendEnabled !== 'undefined') {
      await SystemSetting.updateSetting('autoExtendEnabled', autoExtendEnabled, adminId);
      updates.autoExtendEnabled = autoExtendEnabled;
    }
    if (typeof autoExtendThreshold !== 'undefined') {
      await SystemSetting.updateSetting('autoExtendThreshold', autoExtendThreshold, adminId);
      updates.autoExtendThreshold = autoExtendThreshold;
    }
    if (typeof autoExtendDuration !== 'undefined') {
      await SystemSetting.updateSetting('autoExtendDuration', autoExtendDuration, adminId);
      updates.autoExtendDuration = autoExtendDuration;
    }

    res.json({
      success: true,
      message: 'Auto-extend settings updated successfully',
      data: updates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with pagination
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status or role
 * PUT /api/admin/users/:userId
 */
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all auctions with admin view
 * GET /api/admin/auctions
 */
export const getAllAuctions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const auctions = await Auction.find(filter)
      .populate('product')
      .populate('seller', 'fullName email')
      .populate('currentBidder', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Auction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        auctions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;

    const logs = await AuditLog.find(filter)
      .populate('user', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system statistics
 * GET /api/admin/statistics
 */
export const getStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAuctions = await Auction.countDocuments();
    const activeAuctions = await Auction.countDocuments({ status: 'active' });
    const totalBids = await Bid.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAuctions,
        activeAuctions,
        totalBids,
        totalProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * API 4.1: Quản lý Danh mục (CRUD)
 * ============================================
 */

/**
 * Get all categories
 * GET /api/admin/categories
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, level, isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (level) filter.level = parseInt(level);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const categories = await Category.find(filter)
      .populate('parentId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * GET /api/admin/categories/:id
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('parentId', 'name');
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ categoryId: id, isActive: true });

    res.json({
      success: true,
      data: {
        category,
        productCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 * POST /api/admin/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, parentId, level } = req.body;

    // Validate required fields
    if (!name || !slug || !level) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug, and level are required'
      });
    }

    // Check duplicate slug
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists'
      });
    }

    // Validate level
    if (![1, 2].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Level must be 1 or 2'
      });
    }

    // If level 2, parentId is required
    if (level === 2 && !parentId) {
      return res.status(400).json({
        success: false,
        message: 'Parent category is required for level 2 categories'
      });
    }

    // If level 2, validate parent exists and is level 1
    if (level === 2) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      if (parent.level !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Parent must be a level 1 category'
        });
      }
    }

    const newCategory = new Category({
      name,
      slug,
      parentId: level === 2 ? parentId : null,
      level,
      path: level === 2 && parentId ? [parentId] : []
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: newCategory }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug, _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists'
        });
      }
      category.slug = slug;
    }

    if (name) category.name = name;
    if (isActive !== undefined) category.isActive = isActive;
    category.updatedAt = new Date();

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 * Cannot delete if there are products using this category
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${productCount} product(s) using this category.`,
        data: { productCount }
      });
    }

    // Check if category has subcategories (if level 1)
    if (category.level === 1) {
      const subcategoryCount = await Category.countDocuments({ parentId: id });
      if (subcategoryCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. There are ${subcategoryCount} subcategory(ies) under this category.`,
          data: { subcategoryCount }
        });
      }
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * API 4.2: Gỡ bỏ sản phẩm (Admin)
 * ============================================
 */

/**
 * Remove product
 * DELETE /api/admin/products/:productId
 * Different strategies based on auction status
 */
export const removeProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const adminId = req.user?._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const auction = await Auction.findOne({ product: productId });
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found for this product'
      });
    }

    let action = '';
    let message = '';

    // Strategy 1: Hard delete if auction hasn't started or no bids
    if (auction.status === 'pending' || auction.bidCount === 0) {
      // Delete related records
      await Promise.all([
        Product.findByIdAndDelete(productId),
        Auction.findByIdAndDelete(auction._id),
        Watchlist.deleteMany({ product: productId }),
        Question.deleteMany({ product: productId }),
        Bid.deleteMany({ auctionId: auction._id })
      ]);

      action = 'hard_delete';
      message = 'Product and all related data have been permanently deleted';
    }
    // Strategy 2: Cancel auction if active with bids
    else if (auction.status === 'active' && auction.bidCount > 0) {
      auction.status = 'cancelled';
      product.isActive = false;
      product.deletedAt = new Date();
      product.deletedBy = adminId;

      await Promise.all([
        auction.save(),
        product.save()
      ]);

      // TODO: Notify bidders about cancellation
      // TODO: Process refunds if needed

      action = 'cancelled';
      message = `Auction cancelled. ${auction.bidCount} bidder(s) will be notified`;
    }
    // Strategy 3: Archive if already ended
    else if (auction.status === 'ended') {
      product.isActive = false;
      product.isArchived = true;
      product.deletedAt = new Date();
      product.deletedBy = adminId;

      await product.save();

      action = 'archived';
      message = 'Product has been archived';
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove product in current auction status'
      });
    }

    // Create audit log
    await AuditLog.create({
      user: adminId,
      action: 'REMOVE_PRODUCT',
      resource: 'Product',
      resourceId: productId,
      details: {
        action,
        auctionStatus: auction.status,
        bidCount: auction.bidCount,
        reason: req.body.reason || 'Admin removal'
      }
    });

    res.json({
      success: true,
      message,
      data: {
        productId,
        action,
        auctionStatus: auction.status,
        bidCount: auction.bidCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================
 * API 4.3: Upgrade Request Management
 * ============================================
 */

/**
 * Get all upgrade requests
 * GET /api/admin/upgrade-requests
 */
export const getAllUpgradeRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const requests = await UpgradeRequest.find(filter)
      .populate('user', 'fullName email username roles sellerExpiresAt')
      .populate('reviewedBy', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await UpgradeRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upgrade request by ID
 * GET /api/admin/upgrade-requests/:id
 */
export const getUpgradeRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await UpgradeRequest.findById(id)
      .populate('user', 'fullName email username roles sellerExpiresAt createdAt')
      .populate('reviewedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve upgrade request
 * PUT /api/admin/upgrade-requests/:id/approve
 */
export const approveUpgradeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;
    const adminId = req.user?._id;

    const request = await UpgradeRequest.findById(id).populate('user');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    const user = request.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user: add seller role and set expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    if (!user.roles.includes('seller')) {
      user.roles.push('seller');
    }
    user.sellerExpiresAt = expiresAt;
    await user.save();

    // Update request
    request.status = 'approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || '';
    await request.save();

    // Create audit log
    await AuditLog.create({
      user: adminId,
      action: 'APPROVE_UPGRADE_REQUEST',
      resource: 'UpgradeRequest',
      resourceId: id,
      details: {
        userId: user._id,
        sellerExpiresAt: expiresAt,
        reviewNote
      }
    });

    res.json({
      success: true,
      message: 'Upgrade request approved successfully',
      data: {
        requestId: request._id,
        userId: user._id,
        sellerExpiresAt: expiresAt,
        status: request.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject upgrade request
 * PUT /api/admin/upgrade-requests/:id/reject
 */
export const rejectUpgradeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;
    const adminId = req.user?._id;

    if (!reviewNote || reviewNote.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review note is required for rejection'
      });
    }

    const request = await UpgradeRequest.findById(id).populate('user');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upgrade request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`
      });
    }

    // Update request
    request.status = 'rejected';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote.trim();
    await request.save();

    // Create audit log
    await AuditLog.create({
      user: adminId,
      action: 'REJECT_UPGRADE_REQUEST',
      resource: 'UpgradeRequest',
      resourceId: id,
      details: {
        userId: request.user._id,
        reviewNote
      }
    });

    res.json({
      success: true,
      message: 'Upgrade request rejected',
      data: {
        requestId: request._id,
        status: request.status,
        reviewNote: request.reviewNote
      }
    });
  } catch (error) {
    next(error);
  }
};
