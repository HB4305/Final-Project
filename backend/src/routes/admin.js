import express from 'express';
import {
    updateAutoExtendSettings,
    getAutoExtendSettings
} from '../controllers/admin.js';
// import {verifyToken } from '../middlewares/auth.js';

const router = express.Router();
/**
 * Admin cấu hình tự động gia hạn
 */
router.get('/settings/auto-extend',
    // verifyToken,
    // isAdmin,
    getAutoExtendSettings
);

router.put('/settings/auto-extend',
    // verifyToken,
    // isAdmin,
    updateAutoExtendSettings
);

export default router;