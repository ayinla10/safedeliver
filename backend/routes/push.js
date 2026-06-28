const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateSeller } = require('../middleware/auth');

// Save/update push subscription for logged-in seller
router.post('/subscribe', authenticateSeller, async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Upsert — one row per endpoint per user
        await db.query(
            `INSERT INTO web_push_subscriptions (user_id, endpoint, subscription)
             VALUES ($1, $2, $3)
             ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, subscription = $3, updated_at = NOW()`,
            [req.seller.id, subscription.endpoint, subscription]
        );

        res.json({ message: 'Subscribed to push notifications' });
    } catch (err) {
        console.error('Push subscribe error:', err);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Remove subscription (on logout)
router.post('/unsubscribe', authenticateSeller, async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) {
            await db.query('DELETE FROM web_push_subscriptions WHERE user_id = $1 AND endpoint = $2', [req.seller.id, endpoint]);
        } else {
            await db.query('DELETE FROM web_push_subscriptions WHERE user_id = $1', [req.seller.id]);
        }
        res.json({ message: 'Unsubscribed' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

// Return VAPID public key (needed by frontend to subscribe)
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

module.exports = router;
