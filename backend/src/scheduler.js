import cron from 'node-cron';
import { Auction, Bid, User } from './models/index.js';
import SystemSetting from './models/SystemSetting.js';
import { auctionService } from './services/AuctionService.js';
import { AUCTION_STATUS } from './lib/constants.js';
import { sendEmail } from './utils/email.js';

export const startScheduler = () => {
    console.log('Starting Auction Scheduler...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            console.log(`[Scheduler] Checking auctions at ${now.toISOString()}`);

            // 1. Convert SCHEDULED -> ACTIVE
            const scheduledAuctions = await Auction.find({
                status: AUCTION_STATUS.SCHEDULED,
                startAt: { $lte: now }
            });

            for (const auction of scheduledAuctions) {
                try {
                    console.log(`Activating auction ${auction._id}`);
                    await auctionService.activateAuction(auction._id);
                } catch (err) {
                    console.error(`Failed to activate auction ${auction._id}:`, err);
                }
            }

            // 2. Auto-extend auctions with bids in last X minutes (from SystemSettings)
            const autoExtendEnabled = await SystemSetting.getSetting('autoExtendEnabled', true);
            const autoExtendThreshold = await SystemSetting.getSetting('autoExtendThreshold', 5); // phút
            const autoExtendDuration = await SystemSetting.getSetting('autoExtendDuration', 10); // phút
            
            if (autoExtendEnabled) {
                const thresholdTime = new Date(now.getTime() + autoExtendThreshold * 60 * 1000);
                const activeAuctions = await Auction.find({
                    status: AUCTION_STATUS.ACTIVE,
                    autoExtendEnabled: true,
                    endAt: { $gt: now, $lte: thresholdTime },
                    autoExtendCount: { $lt: 3 } // Tối đa 3 lần
                });

                for (const auction of activeAuctions) {
                    try {
                        // Kiểm tra có bid nào trong khoảng thời gian từ (endAt - threshold) đến hiện tại
                        const thresholdBeforeEnd = new Date(auction.endAt.getTime() - autoExtendThreshold * 60 * 1000);
                        const recentBid = await Bid.findOne({
                            auctionId: auction._id,
                            isValid: true,
                            createdAt: { $gte: thresholdBeforeEnd }
                        }).sort({ createdAt: -1 });

                        if (recentBid) {
                            // Gia hạn thêm X phút
                            const newEndTime = new Date(auction.endAt.getTime() + autoExtendDuration * 60 * 1000);
                            
                            console.log(`Extending auction ${auction._id} from ${auction.endAt} to ${newEndTime} (extension #${auction.autoExtendCount + 1}) - Threshold: ${autoExtendThreshold}min, Duration: ${autoExtendDuration}min`);
                            
                            auction.endAt = newEndTime;
                            auction.autoExtendCount = (auction.autoExtendCount || 0) + 1;
                            auction.lastExtendedAt = now;
                            
                            // Lưu lịch sử gia hạn
                            if (!auction.autoExtendHistory) {
                                auction.autoExtendHistory = [];
                            }
                            auction.autoExtendHistory.push({
                                extendedAt: now,
                                oldEndTime: new Date(auction.endAt.getTime() - autoExtendDuration * 60 * 1000),
                                newEndTime: newEndTime,
                                triggeredByBidId: recentBid._id
                            });
                            
                            await auction.save();
                            console.log(`✓ Auction ${auction._id} extended successfully`);
                        }
                    } catch (err) {
                        console.error(`Failed to extend auction ${auction._id}:`, err);
                    }
                }
            } else {
                console.log('[SCHEDULER] Auto-extend is disabled');
            }

            // 3. Convert ACTIVE -> ENDED
            const endingAuctions = await Auction.find({
                status: AUCTION_STATUS.ACTIVE,
                endAt: { $lte: now }
            });

            for (const auction of endingAuctions) {
                try {
                    console.log(`Ending auction ${auction._id}`);
                    await auctionService.endAuction(auction._id);
                } catch (err) {
                    console.error(`Failed to end auction ${auction._id}:`, err);
                }
            }

        } catch (error) {
            console.error('[Scheduler] Error:', error);
        }
    });

    // Run every hour to check and downgrade expired sellers
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            console.log(`[Scheduler] Checking expired sellers at ${now.toISOString()}`);

            // Find sellers with expired privileges
            const expiredSellers = await User.find({
                roles: 'seller',
                sellerExpiresAt: { $lte: now }
            });

            console.log(`[Scheduler] Found ${expiredSellers.length} expired sellers`);

            for (const user of expiredSellers) {
                try {
                    console.log(`Downgrading user ${user._id} (${user.email}) from seller to bidder`);
                    
                    // Remove seller role
                    user.roles = user.roles.filter(role => role !== 'seller');
                    user.sellerExpiresAt = null;
                    await user.save();

                    // Send notification email
                    if (user.email) {
                      try {
                        await sendEmail({
                          to: user.email,
                          subject: 'Seller Privileges Expired',
                          html: `
                            <h2>Seller Privileges Expired</h2>
                            <p>Dear ${user.fullName || user.username},</p>
                            <p>Your seller privileges have expired after 7 days. You have been downgraded to a bidder account.</p>
                            <p>If you wish to continue as a seller, please submit a new upgrade request from your dashboard.</p>
                            <p>Best regards,<br>AuctionHub Team</p>
                          `
                        });
                        console.log(`✓ Expiration notification sent to ${user.email}`);
                      } catch (emailError) {
                        console.error(`Failed to send email to ${user.email}:`, emailError);
                      }
                    }

                    console.log(`✓ User ${user._id} downgraded successfully`);
                } catch (err) {
                    console.error(`Failed to downgrade user ${user._id}:`, err);
                }
            }

        } catch (error) {
            console.error('[Scheduler] Error checking expired sellers:', error);
        }
    });
};
