import express from "express";
import {
  updateAutoExtendSettings,
  getAutoExtendSettings,
} from "../controllers/admin.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";
import { USER_ROLES } from "../lib/constants.js";

const router = express.Router();
/**
 * Admin cấu hình tự động gia hạn
 */
router.get(
  "/settings/auto-extend",
  // verifyToken,
  // isAdmin,
  getAutoExtendSettings
);

router.put(
  "/settings/auto-extend",
  // verifyToken,
  // isAdmin,
  updateAutoExtendSettings
);

export default router;
