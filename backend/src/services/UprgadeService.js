import User from '../models/User.js';
import UpgradeRequest from '../models/UpgradeRequest.js';
import { AppError } from '../utils/errors.js';
import { ERROR_CODES } from '../lib/constants.js';

export class UpgradeService {
    async approveUpgradeRequest(requestId) {
        const upgradeRequest = await UpgradeRequest.findById(requestId);
        if (!upgradeRequest) {
            throw new AppError(
                "Yêu cầu nâng cấp không tồn tại",
                404,
                ERROR_CODES.UPGRADE_REQUEST_NOT_FOUND
            );
        }
        UpgradeRequest.updateOne({ _id: requestId }, { status: 'approved' });
        User.updateOne({ _id: upgradeRequest.user }, { roles: { $append: 'seller' } });
        return upgradeRequest;
    }

    async rejectUpgradeRequest(requestId) {
        const upgradeRequest = await UpgradeRequest.findById(requestId);
        if (!upgradeRequest) {
            throw new AppError(
                "Yêu cầu nâng cấp không tồn tại",
                404,
                ERROR_CODES.UPGRADE_REQUEST_NOT_FOUND
            );
        }
        UpgradeRequest.updateOne({ _id: requestId }, { status: 'rejected' });
        return upgradeRequest;
    }
}

export const upgradeService = new UpgradeService();
