const webpush = require('web-push');
const db = require('../db');

// Configure VAPID
webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@safedeliver.co',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a specific user (by seller_id or role)
 */
async function sendToUser(userId, payload) {
    if (!process.env.VAPID_PUBLIC_KEY) return;
    try {
        const result = await db.query(
            'SELECT subscription FROM web_push_subscriptions WHERE user_id = $1',
            [userId]
        );
        for (const row of result.rows) {
            try {
                await webpush.sendNotification(row.subscription, JSON.stringify(payload));
            } catch (err) {
                // Subscription expired/invalid — remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.query(
                        'DELETE FROM web_push_subscriptions WHERE user_id = $1 AND subscription = $2',
                        [userId, row.subscription]
                    );
                }
            }
        }
    } catch (err) {
        console.error('[WebPush] sendToUser error:', err.message);
    }
}

/**
 * Send a push notification to all admins
 */
async function sendToAdmins(payload) {
    if (!process.env.VAPID_PUBLIC_KEY) return;
    try {
        const result = await db.query(
            'SELECT wps.user_id, wps.subscription FROM web_push_subscriptions wps JOIN sellers s ON wps.user_id = s.id WHERE s.is_admin = true'
        );
        for (const row of result.rows) {
            try {
                await webpush.sendNotification(row.subscription, JSON.stringify(payload));
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.query('DELETE FROM web_push_subscriptions WHERE user_id = $1 AND subscription = $2', [row.user_id, row.subscription]);
                }
            }
        }
    } catch (err) {
        console.error('[WebPush] sendToAdmins error:', err.message);
    }
}

module.exports = { sendToUser, sendToAdmins };
