const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const db = require('../db');
const escrow = require('../services/escrow');
const sim = require('../services/simulationEngine');
const notify = require('../services/notify');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

function paystackHeaders() {
    return { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' };
}

// ── Initialize payment (called by frontend) ──
router.post('/initialize', async (req, res) => {
    try {
        const { transaction_id, buyer_token } = req.body;
        if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'Paystack not configured' });

        // Find the transaction
        const result = await db.query('SELECT * FROM transactions WHERE id = $1', [transaction_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        const tx = result.rows[0];

        // Verify buyer owns this transaction
        if (tx.buyer_token !== buyer_token) return res.status(403).json({ error: 'Unauthorized' });
        if (tx.status !== 'ACCEPTED') return res.status(400).json({ error: 'Order must be ACCEPTED before payment' });

        // Amount in pesewas (Paystack uses smallest currency unit)
        const amountInPesewas = tx.total_amount; // already stored in pesewas

        const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pay/verify?order_ref=${tx.order_ref}`;

        // Call Paystack to initialize
        const paystackRes = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
            email: tx.buyer_email || `${tx.buyer_phone.replace(/[^0-9]/g, '')}@safedeliver.co`,
            amount: amountInPesewas,
            currency: 'GHS',
            reference: `SD-${tx.id.substring(0, 8)}-${Date.now()}`,
            callback_url: callbackUrl,
            metadata: {
                transaction_id: tx.id,
                order_ref: tx.order_ref,
                buyer_name: tx.buyer_name,
                product_name: tx.product_name,
            },
        }, { headers: paystackHeaders() });

        if (!paystackRes.data.status) throw new Error(paystackRes.data.message);

        // Save the Paystack reference on the transaction
        await db.query(
            'UPDATE transactions SET paystack_reference = $1, updated_at = NOW() WHERE id = $2',
            [paystackRes.data.data.reference, tx.id]
        );

        res.json({
            authorization_url: paystackRes.data.data.authorization_url,
            reference: paystackRes.data.data.reference,
            access_code: paystackRes.data.data.access_code,
        });
    } catch (err) {
        console.error('Paystack init error:', err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data?.message || err.message });
    }
});

// ── Verify payment (called by frontend after redirect) ──
router.get('/verify/:reference', async (req, res) => {
    try {
        if (!PAYSTACK_SECRET) return res.status(500).json({ error: 'Paystack not configured' });

        const { reference } = req.params;

        // Verify with Paystack
        const paystackRes = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
            headers: paystackHeaders(),
        });

        if (!paystackRes.data.status) return res.status(400).json({ error: 'Verification failed' });

        const paystackData = paystackRes.data.data;

        if (paystackData.status !== 'success') {
            return res.json({ verified: false, status: paystackData.status, message: 'Payment not successful' });
        }

        // Find our transaction
        const result = await db.query('SELECT * FROM transactions WHERE paystack_reference = $1', [reference]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found for this reference' });
        const tx = result.rows[0];

        // Only transition if still ACCEPTED (avoid double-processing from webhook + verify)
        if (tx.status === 'ACCEPTED') {
            await escrow.transition(tx.id, 'PAID');
            const simRef = await sim.holdFunds(tx.id, tx.order_ref, tx.total_amount);
            await db.query('UPDATE transactions SET sim_reference = $1 WHERE id = $2', [simRef, tx.id]);

            // SMS to buyer — payment confirmed
            await notify.sms(tx.buyer_phone,
                `SafeDeliver: Payment of GHS ${(tx.total_amount / 100).toFixed(2)} confirmed for order ${tx.order_ref}. Your funds are held safely in escrow until delivery. Track: ${process.env.FRONTEND_URL}/track/${tx.order_ref}`,
                tx.id, tx.order_ref
            );

            // Push notification to seller
            const webpush = require('../services/webpush');
            await webpush.sendToUser(tx.seller_id, {
                title: '💰 Payment Received!',
                body: `GHS ${(tx.total_amount / 100).toFixed(2)} secured in escrow for order ${tx.order_ref}. Ship now!`,
                url: '/seller/dashboard/orders',
            });
        }

        res.json({ verified: true, order_ref: tx.order_ref, status: 'PAID' });
    } catch (err) {
        console.error('Paystack verify error:', err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Webhook (called by Paystack server — most reliable) ──
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // Verify webhook signature
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET)
            .update(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
            .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        if (event.event === 'charge.success') {
            const reference = event.data.reference;
            const result = await db.query('SELECT * FROM transactions WHERE paystack_reference = $1', [reference]);

            if (result.rows.length > 0) {
                const tx = result.rows[0];
                // Only transition if still ACCEPTED
                if (tx.status === 'ACCEPTED') {
                    await escrow.transition(tx.id, 'PAID');
                    const simRef = await sim.holdFunds(tx.id, tx.order_ref, tx.total_amount);
                    await db.query('UPDATE transactions SET sim_reference = $1 WHERE id = $2', [simRef, tx.id]);

                    // SMS to buyer — payment confirmed
                    await notify.sms(tx.buyer_phone,
                        `SafeDeliver: Payment of GHS ${(tx.total_amount / 100).toFixed(2)} confirmed for order ${tx.order_ref}. Your funds are held safely in escrow until delivery. Track: ${process.env.FRONTEND_URL}/track/${tx.order_ref}`,
                        tx.id, tx.order_ref
                    );

                    // Push notification to seller
                    const webpushW = require('../services/webpush');
                    await webpushW.sendToUser(tx.seller_id, {
                        title: '💰 Payment Received!',
                        body: `GHS ${(tx.total_amount / 100).toFixed(2)} secured in escrow for order ${tx.order_ref}. Ship now!`,
                        url: '/seller/dashboard/orders',
                    });
                }
            }
        }

        res.sendStatus(200); // Always respond 200 to Paystack
    } catch (err) {
        console.error('Webhook error:', err);
        res.sendStatus(200); // Still respond 200 — Paystack retries on failure
    }
});

// ── Check if Paystack is configured ──
router.get('/config', (req, res) => {
    res.json({ paystack_enabled: !!PAYSTACK_SECRET });
});

module.exports = router;
