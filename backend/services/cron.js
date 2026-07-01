const cron = require('node-cron');
const db = require('../db');
const escrow = require('./escrow');
const notify = require('./notify');
const emailService = require('./email');
const appSettings = require('./settings');

function startAutoReleaseCron() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        try {
            // 1. Auto-release: shipped orders older than ESCROW_AUTO_RELEASE_DAYS (default 5)
            const autoReleaseDays = await appSettings.getInt('ESCROW_AUTO_RELEASE_DAYS', 5);
            const shipped = await db.query(
                `SELECT id, order_ref FROM transactions WHERE status = 'SHIPPED' AND shipped_at < NOW() - ($1 * INTERVAL '1 day')`,
                [autoReleaseDays]
            );
            for (const tx of shipped.rows) {
                try {
                    // Fetch full tx details for email
                    const fullTx = await db.query(
                        `SELECT t.*, s.email as seller_email, s.full_name as seller_name
                         FROM transactions t JOIN sellers s ON t.seller_id = s.id
                         WHERE t.id = $1`, [tx.id]
                    );
                    const row = fullTx.rows[0];

                    await escrow.transition(tx.id, 'AUTO_RELEASED');
                    await escrow.releaseFundsToSeller(tx.id);

                    // SMS to seller
                    await notify.sms(row.seller_phone || '',
                        `SafeDeliver: Funds for order ${row.order_ref} have been auto-released to your MoMo. GHS ${(row.seller_payout_amount / 100).toFixed(2)}.`,
                        tx.id, row.order_ref
                    ).catch(() => {});

                    // Email to seller
                    if (row.seller_email) {
                        emailService.fundsReleased(row.seller_email, {
                            sellerName: row.seller_name,
                            orderRef: row.order_ref,
                            amount: row.seller_payout_amount,
                            dashboardUrl: `${process.env.FRONTEND_URL}/seller/dashboard`,
                        }).catch(() => {});
                    }

                    console.log(`[Cron] Auto-released: ${tx.order_ref}`);
                } catch (err) {
                    console.error(`[Cron] Failed to auto-release ${tx.order_ref}:`, err.message);
                }
            }

            // 2. Quote timeout: cancel REQUESTED orders past deadline, deduct seller score
            const expired = await db.query(
                `SELECT t.id, t.order_ref, t.seller_id, t.buyer_phone, t.buyer_token, t.product_name
                 FROM transactions t
                 WHERE t.status = 'REQUESTED' AND t.quote_deadline < NOW()`
            );
            for (const tx of expired.rows) {
                try {
                    await db.query(`UPDATE transactions SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [tx.id]);
                    // Deduct 5 points from seller score (min 0)
                    await db.query(`UPDATE sellers SET seller_score = GREATEST(0, seller_score - 5), updated_at = NOW() WHERE id = $1`, [tx.seller_id]);
                    // Notify buyer
                    await notify.sms(tx.buyer_phone,
                        `⏰ Your order ${tx.order_ref} for "${tx.product_name}" has been cancelled because the seller did not respond within 12 hours. No money was taken.`,
                        tx.id, tx.order_ref
                    );
                    console.log(`[Cron] Quote timeout — cancelled ${tx.order_ref}, seller score deducted`);
                } catch (err) {
                    console.error(`[Cron] Failed to timeout ${tx.order_ref}:`, err.message);
                }
            }
        } catch (err) {
            console.error('[Cron] Error:', err.message);
        }
    });

    console.log('⏰ Cron started (auto-release + quote timeout, every 15 min)');
}

module.exports = { startAutoReleaseCron };
