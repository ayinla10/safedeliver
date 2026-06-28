const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const crypto = require('crypto');
const db = require('../db');
const { authenticateSeller } = require('../middleware/auth');
const escrow = require('../services/escrow');
const sim = require('../services/simulationEngine');
const notify = require('../services/notify');
const audit = require('../services/audit');
const webpush = require('../services/webpush');

const FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5');



// ── Seller: Get performance stats ──
router.get('/stats', authenticateSeller, async (req, res, next) => {
    try {
        const stats = await db.query(
            `SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status IN ('PAID', 'SHIPPED', 'DELIVERED', 'RELEASED') THEN 1 ELSE 0 END) as active_orders,
                SUM(CASE WHEN status = 'RELEASED' THEN seller_payout_amount ELSE 0 END) as wallet_balance,
                SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END) as incoming_funds
             FROM transactions WHERE seller_id = $1`,
            [req.seller.id]
        );
        const s = stats.rows[0];
        res.json({
            total_orders: parseInt(s.total_orders || 0),
            active_orders: parseInt(s.active_orders || 0),
            wallet_balance: parseFloat(s.wallet_balance || 0) / 100,
            incoming_funds: parseFloat(s.incoming_funds || 0) / 100
        });
    } catch (err) { next(err); }
});

// ── Public: get checkout link info (includes seller city/region) ──
router.get('/pay/:linkCode', async (req, res) => {
    const result = await db.query(
        `SELECT cl.*, s.full_name as seller_name, s.city as seller_city, s.region as seller_region
         FROM checkout_links cl JOIN sellers s ON cl.seller_id = s.id
         WHERE cl.link_code = $1 AND cl.is_active = true`,
        [req.params.linkCode]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Checkout link not found or inactive' });
    const link = result.rows[0];
    link.fee_percent = FEE_PERCENT;
    res.json(link);
});

// ── Create order (REQUESTED — no payment) ──
router.post('/', async (req, res) => {
    try {
        const { checkout_link_id, buyer_name, buyer_phone, buyer_email, buyer_lat, buyer_lng, buyer_location_text, buyer_address } = req.body;
        if (!buyer_name || !buyer_phone) return res.status(400).json({ error: 'Buyer name and phone required' });

        // Find the checkout link
        let linkResult = await db.query(
            `SELECT cl.*, s.id as seller_id, s.phone as seller_phone, s.full_name as seller_name
             FROM checkout_links cl JOIN sellers s ON cl.seller_id = s.id WHERE cl.link_code = $1 AND cl.is_active = true`,
            [checkout_link_id]
        );
        if (linkResult.rows.length === 0) {
            linkResult = await db.query(
                `SELECT cl.*, s.id as seller_id, s.phone as seller_phone, s.full_name as seller_name
                 FROM checkout_links cl JOIN sellers s ON cl.seller_id = s.id WHERE cl.id = $1::uuid AND cl.is_active = true`,
                [checkout_link_id]
            );
            if (linkResult.rows.length === 0) return res.status(404).json({ error: 'Checkout link not found' });
        }
        const link = linkResult.rows[0];

        const orderRef = `SD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        const buyerToken = crypto.randomBytes(32).toString('hex');
        const id = uuid();
        const quoteDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now

        await db.query(
            `INSERT INTO transactions (id, order_ref, checkout_link_id, seller_id, buyer_name, buyer_phone, buyer_email, buyer_address, buyer_lat, buyer_lng, buyer_location_text, buyer_token, product_name, total_amount, status, quote_deadline)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'REQUESTED',$15)`,
            [id, orderRef, link.id, link.seller_id, buyer_name, buyer_phone, buyer_email || null,
                buyer_address || buyer_location_text || null, buyer_lat || null, buyer_lng || null, buyer_location_text || null,
                buyerToken, link.product_name, link.price, quoteDeadline]
        );

        await db.query('UPDATE checkout_links SET order_count = order_count + 1 WHERE id = $1', [link.id]);

        // SMS to buyer — order placed confirmation
        await notify.sms(buyer_phone,
            `SafeDeliver: Hi ${buyer_name}, your order for "${link.product_name}" (Ref: ${orderRef}) has been placed! The seller will quote delivery within 12 hours. Track: ${process.env.FRONTEND_URL}/track/${orderRef}`,
            id, orderRef
        );

        // Push notification to seller
        await webpush.sendToUser(link.seller_id, {
            title: '📦 New Order Request',
            body: `${buyer_name} wants "${link.product_name}". Quote delivery within 12 hours.`,
            url: '/seller/dashboard/orders',
        });

        res.status(201).json({
            transaction_id: id,
            order_ref: orderRef,
            buyer_token: buyerToken,
            status: 'REQUESTED',
            message: 'Order placed! The seller will quote delivery within 12 hours.'
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// ── Seller: quote delivery fee ──
router.patch('/:id/quote', authenticateSeller, async (req, res) => {
    try {
        const { delivery_fee } = req.body;
        if (delivery_fee == null || delivery_fee < 0) return res.status(400).json({ error: 'Delivery fee required (can be 0)' });

        const result = await db.query('SELECT * FROM transactions WHERE id = $1 AND seller_id = $2', [req.params.id, req.seller.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        const tx = result.rows[0];
        if (tx.status !== 'REQUESTED') return res.status(400).json({ error: 'Can only quote REQUESTED orders' });

        const deliveryFeeInt = Math.round(parseFloat(delivery_fee) * 100);
        const totalAmount = tx.total_amount + deliveryFeeInt; // product price + delivery
        
        // 5% of product price, max 50 GHS (5000 pesewas)
        let platformFee = Math.round(tx.total_amount * 0.05);
        if (platformFee > 5000) platformFee = 5000;
        
        const sellerPayout = totalAmount - platformFee;

        await db.query(
            `UPDATE transactions SET delivery_fee = $1, total_amount = $2, platform_fee = $3, seller_payout_amount = $4, status = 'QUOTED', quoted_at = NOW(), updated_at = NOW() WHERE id = $5`,
            [deliveryFeeInt, totalAmount, platformFee, sellerPayout, tx.id]
        );

        // SMS to buyer — delivery quoted
        await notify.sms(tx.buyer_phone,
            `SafeDeliver: Your delivery quote for order ${tx.order_ref} is ready! Delivery: GHS ${(deliveryFeeInt / 100).toFixed(2)}, Total: GHS ${(totalAmount / 100).toFixed(2)}. Review & pay: ${process.env.FRONTEND_URL}/track/${tx.order_ref}`,
            tx.id, tx.order_ref
        );

        await audit.log('SELLER', req.seller.id, 'QUOTE_DELIVERY', 'TRANSACTION', tx.id, req.ip);
        res.json({ message: 'Delivery fee quoted', total_amount: totalAmount, delivery_fee: deliveryFeeInt });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Buyer: accept quote + choose delivery type ──
router.patch('/:orderRef/accept', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });

        const result = await db.query('SELECT * FROM transactions WHERE order_ref = $1 AND buyer_token = $2', [req.params.orderRef, token]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const tx = result.rows[0];
        if (tx.status !== 'QUOTED') return res.status(400).json({ error: 'Order must be QUOTED to accept' });

        await db.query(`UPDATE transactions SET status = 'ACCEPTED', delivery_type = 'SELLER', updated_at = NOW() WHERE id = $1`, [tx.id]);

        res.json({ message: 'Order accepted', delivery_type: 'SELLER', status: 'ACCEPTED' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Buyer: cancel order ──
router.patch('/:orderRef/cancel', async (req, res) => {
    try {
        const { token } = req.body;
        const result = await db.query('SELECT * FROM transactions WHERE order_ref = $1 AND buyer_token = $2', [req.params.orderRef, token]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const tx = result.rows[0];
        if (!['REQUESTED', 'QUOTED'].includes(tx.status)) return res.status(400).json({ error: 'Cannot cancel at this stage' });

        await db.query(`UPDATE transactions SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [tx.id]);
        res.json({ message: 'Order cancelled. No money was taken.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Simulate payment confirmation (dev/admin only — requires MIGRATE_SECRET header) ──
router.post('/sim-confirm', async (req, res) => {
    // Only allow in development OR with the migrate secret
    const secret = req.headers['x-migrate-secret'];
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && secret !== process.env.MIGRATE_SECRET) {
        return res.status(403).json({ error: 'Forbidden: sim-confirm is disabled in production' });
    }

    try {
        const { transaction_id } = req.body;
        const result = await db.query('SELECT * FROM transactions WHERE id = $1', [transaction_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        const tx = result.rows[0];
        if (tx.status !== 'ACCEPTED') return res.status(400).json({ error: 'Order must be ACCEPTED before payment' });

        await escrow.transition(transaction_id, 'PAID');
        const simRef = await sim.holdFunds(transaction_id, tx.order_ref, tx.total_amount);
        await db.query('UPDATE transactions SET sim_reference = $1 WHERE id = $2', [simRef, transaction_id]);

        // SMS to buyer — payment confirmed
        await notify.sms(tx.buyer_phone,
            `SafeDeliver: Payment of GHS ${(tx.total_amount / 100).toFixed(2)} confirmed for order ${tx.order_ref}. Your funds are held safely in escrow until delivery. Track: ${process.env.FRONTEND_URL}/track/${tx.order_ref}`,
            transaction_id, tx.order_ref
        );

        // Push notification to seller
        await webpush.sendToUser(tx.seller_id, {
            title: '💰 Payment Received!',
            body: `GHS ${(tx.total_amount / 100).toFixed(2)} secured in escrow for order ${tx.order_ref}. Ship now!`,
            url: '/seller/dashboard/orders',
        });

        res.json({ message: 'Payment confirmed', sim_reference: simRef });
    } catch (err) {
        console.error('Sim confirm error:', err);
        res.status(500).json({ error: err.message || 'Payment confirmation failed' });
    }
});

// ── Track order by ORDER REF (public, bookmark-friendly) ──
router.get('/track-order/:orderRef', async (req, res) => {
    const { token } = req.query; // Optional buyer_token for auth'd actions
    const result = await db.query(
        `SELECT t.*, cl.image_url, cl.price as product_price, s.city as seller_city, s.region as seller_region, s.pickup_description as seller_pickup, s.seller_score, s.full_name as seller_name
         FROM transactions t
         LEFT JOIN checkout_links cl ON t.checkout_link_id = cl.id
         LEFT JOIN sellers s ON t.seller_id = s.id
         WHERE t.order_ref = $1`,
        [req.params.orderRef]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const tx = result.rows[0];
    
    // Check if the request has the correct buyer_token for write actions
    const isAuthed = token && tx.buyer_token === token;
    
    tx.can_confirm = isAuthed && tx.status === 'SHIPPED';
    tx.can_dispute = isAuthed && ['PAID', 'SHIPPED'].includes(tx.status);
    tx.dispute_raised = !!tx.dispute_reason;
    tx.can_accept = isAuthed && tx.status === 'QUOTED';
    tx.can_pay = isAuthed && tx.status === 'ACCEPTED';
    tx.can_cancel = isAuthed && ['REQUESTED', 'QUOTED'].includes(tx.status);
    tx.is_authed = isAuthed;
    
    // Strip sensitive fields if not authed
    if (!isAuthed) {
        delete tx.buyer_token;
        delete tx.buyer_email;
    }
    
    // Only show full pickup description after self-delivery + payment
    if (tx.delivery_type !== 'SELF' || !['PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'AUTO_RELEASED'].includes(tx.status)) {
        tx.seller_pickup = null;
    }
    res.json(tx);
});

// ── Track order (legacy, by buyer token) ──
router.get('/track/:token', async (req, res) => {
    const result = await db.query(
        `SELECT t.*, cl.image_url, cl.price as product_price, s.city as seller_city, s.region as seller_region, s.pickup_description as seller_pickup, s.seller_score, s.full_name as seller_name
         FROM transactions t
         LEFT JOIN checkout_links cl ON t.checkout_link_id = cl.id
         LEFT JOIN sellers s ON t.seller_id = s.id
         WHERE t.buyer_token = $1`,
        [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const tx = result.rows[0];
    tx.can_confirm = tx.status === 'SHIPPED';
    tx.can_dispute = ['PAID', 'SHIPPED'].includes(tx.status);
    tx.dispute_raised = !!tx.dispute_reason;
    tx.can_accept = tx.status === 'QUOTED';
    tx.can_pay = tx.status === 'ACCEPTED';
    tx.can_cancel = ['REQUESTED', 'QUOTED'].includes(tx.status);
    tx.is_authed = true;
    if (tx.delivery_type !== 'SELF' || !['PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'AUTO_RELEASED'].includes(tx.status)) {
        tx.seller_pickup = null;
    }
    res.json(tx);
});

// ── Seller: mark as shipped ──
router.patch('/:id/ship', authenticateSeller, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM transactions WHERE id = $1 AND seller_id = $2', [req.params.id, req.seller.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        const tx = result.rows[0];
        if (tx.status !== 'PAID') return res.status(400).json({ error: 'Order must be PAID to ship' });

        await escrow.transition(req.params.id, 'SHIPPED');
        // SMS to buyer — order shipped
        await notify.sms(tx.buyer_phone,
            `SafeDeliver: Great news! Your order ${tx.order_ref} ("${tx.product_name}") has been shipped. Track it here: ${process.env.FRONTEND_URL}/track/${tx.order_ref}`,
            tx.id, tx.order_ref
        );
        await webpush.sendToAdmins({
            title: '📦 Order Shipped',
            body: `Order ${tx.order_ref} marked as shipped by seller.`,
            url: '/admin/transactions',
        });
        await audit.log('SELLER', req.seller.id, 'SHIP_ORDER', 'TRANSACTION', tx.id, req.ip);
        res.json({ message: 'Marked as shipped' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Buyer: confirm delivery ──
router.patch('/:orderRef/confirm-delivery', async (req, res) => {
    try {
        const { token } = req.body;
        const result = await db.query('SELECT * FROM transactions WHERE order_ref = $1 AND buyer_token = $2', [req.params.orderRef, token]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const tx = result.rows[0];
        await escrow.transition(tx.id, 'DELIVERED');
        await escrow.transition(tx.id, 'RELEASED');
        await escrow.releaseFundsToSeller(tx.id);

        // SMS to buyer — delivery confirmed
        await notify.sms(tx.buyer_phone,
            `SafeDeliver: You've confirmed delivery of order ${tx.order_ref}. Payment has been released to the seller. Thank you for using SafeDeliver!`,
            tx.id, tx.order_ref
        );

        // Push notification to seller — funds released
        await webpush.sendToUser(tx.seller_id, {
            title: '💸 Funds Released!',
            body: `Buyer confirmed delivery for order ${tx.order_ref}. GHS ${(tx.seller_payout_amount / 100).toFixed(2)} released to your account.`,
            url: '/seller/dashboard',
        });

        res.json({ message: 'Delivery confirmed, payment released' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Buyer: raise dispute ──
router.post('/:orderRef/dispute', async (req, res) => {
    try {
        const { token, reason, details } = req.body;
        const result = await db.query('SELECT * FROM transactions WHERE order_ref = $1 AND buyer_token = $2', [req.params.orderRef, token]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const tx = result.rows[0];
        await escrow.transition(tx.id, 'DISPUTED');
        await db.query('UPDATE transactions SET dispute_reason = $1, dispute_details = $2 WHERE id = $3', [reason, details || null, tx.id]);
        await notify.email(process.env.ADMIN_EMAIL, `Dispute: ${tx.order_ref}`, `Buyer ${tx.buyer_name} raised dispute: ${reason}`, tx.id, tx.order_ref);
        res.json({ message: 'Dispute submitted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Buyer: submit review ──
router.post('/:orderRef/review', async (req, res) => {
    try {
        const { token, rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        
        const result = await db.query('SELECT * FROM transactions WHERE order_ref = $1 AND buyer_token = $2', [req.params.orderRef, token]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        const tx = result.rows[0];
        
        if (!['DELIVERED', 'RELEASED', 'AUTO_RELEASED'].includes(tx.status)) {
            return res.status(400).json({ error: 'You can only review completed orders' });
        }
        
        const existing = await db.query('SELECT id FROM seller_reviews WHERE transaction_id = $1', [tx.id]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'You have already reviewed this order' });

        await db.query(
            'INSERT INTO seller_reviews (transaction_id, seller_id, buyer_name, rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [tx.id, tx.seller_id, tx.buyer_name, rating, comment || null]
        );

        await db.query(`
            UPDATE sellers 
            SET seller_score = (
                SELECT ROUND(AVG(rating) * 20) 
                FROM seller_reviews 
                WHERE seller_id = $1
            ) 
            WHERE id = $1
        `, [tx.seller_id]);
        
        res.json({ message: 'Review submitted successfully' });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit review' }); }
});

// ── Seller: list transactions (paginated) ──
router.get('/', authenticateSeller, async (req, res) => {
    const { status, limit = 20, page = 1 } = req.query;
    const limitInt = Math.min(parseInt(limit), 100);
    const offset = (Math.max(parseInt(page), 1) - 1) * limitInt;

    let countQ = 'SELECT COUNT(*) FROM transactions WHERE seller_id = $1';
    let q = 'SELECT * FROM transactions WHERE seller_id = $1';
    const params = [req.seller.id];

    if (status) {
        params.push(status);
        q += ` AND status = $${params.length}`;
        countQ += ` AND status = $${params.length}`;
    }

    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [result, countResult] = await Promise.all([
        db.query(q, [...params, limitInt, offset]),
        db.query(countQ, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    res.json({
        transactions: result.rows,
        total,
        page: parseInt(page),
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
    });
});

// ── Seller: get single transaction ──
router.get('/:id', authenticateSeller, async (req, res) => {
    const result = await db.query(
        `SELECT t.*, cl.price as product_price FROM transactions t LEFT JOIN checkout_links cl ON t.checkout_link_id = cl.id WHERE t.id = $1 AND t.seller_id = $2`,
        [req.params.id, req.seller.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
});

module.exports = router;
