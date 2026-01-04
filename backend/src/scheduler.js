import cron from 'node-cron';
import { Auction, Bid } from './models/index.js';
import { auctionService } from './services/AuctionService.js';
import { AUCTION_STATUS } from './lib/constants.js';

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

            // 2. Auto-extend auctions with bids in last 5 minutes
            const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
            const activeAuctions = await Auction.find({
                status: AUCTION_STATUS.ACTIVE,
                autoExtendEnabled: true,
                endAt: { $gt: now, $lte: fiveMinutesFromNow },
                autoExtendCount: { $lt: 3 } // Tối đa 3 lần
            });

            for (const auction of activeAuctions) {
                try {
                    // Kiểm tra có bid nào trong khoảng thời gian từ (endAt - 5 phút) đến hiện tại
                    const fiveMinutesBeforeEnd = new Date(auction.endAt.getTime() - 5 * 60 * 1000);
                    const recentBid = await Bid.findOne({
                        auctionId: auction._id,
                        isValid: true,
                        createdAt: { $gte: fiveMinutesBeforeEnd }
                    }).sort({ createdAt: -1 });

                    if (recentBid) {
                        // Gia hạn thêm 10 phút
                        const newEndTime = new Date(auction.endAt.getTime() + 10 * 60 * 1000);
                        
                        console.log(`Extending auction ${auction._id} from ${auction.endAt} to ${newEndTime} (extension #${auction.autoExtendCount + 1})`);
                        
                        auction.endAt = newEndTime;
                        auction.autoExtendCount = (auction.autoExtendCount || 0) + 1;
                        auction.lastExtendedAt = now;
                        
                        // Lưu lịch sử gia hạn
                        if (!auction.autoExtendHistory) {
                            auction.autoExtendHistory = [];
                        }
                        auction.autoExtendHistory.push({
                            extendedAt: now,
                            oldEndTime: new Date(auction.endAt.getTime() - 10 * 60 * 1000),
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
};
