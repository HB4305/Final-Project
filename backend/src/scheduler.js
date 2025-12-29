import cron from 'node-cron';
import { Auction } from './models/index.js';
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

            // 2. Convert ACTIVE -> ENDED
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
