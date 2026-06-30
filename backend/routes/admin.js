const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const escrow = require('../services/escrow');
const sim = require('../services/simulationEngine');
const audit = require('../services/audit');
const notify = require('../services/notify');
const settings = require('../services/settings');

// All admin routes require admin auth
router.use(authenticateAdmin);

// ── Global platform stats (Overview page) ──────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [txStats, sellerStats, disputeStats] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) AS total_transactions,
                    COALESCE(SUM(total_amount), 0) AS total_volume,
                    COALESCE(SUM(platform_fee), 0) AS platform_fees,
                    COALESCE(SUM(total_amount) FILTER (WHERE status IN ('PAID','SHIPPED','DISPUTED')), 0) AS held_volume,
                    COALESCE(SUM(total_amount) FILTER (WHERE status IN ('RELEASED','AUTO_RELEASED')), 0) AS released_volume,
                    COUNT(*) FILTER (WHERE status IN ('PAID','SHIPPED','DISPUTED')) AS active_orders,
                    COUNT(*) FILTER (WHERE status IN ('RELEASED','AUTO_RELEASED')) AS completed_orders,
                    COUNT(*) FILTER (WHERE status = 'DISPUTED') AS open_disputes,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS orders_last_30d
                FROM transactions
            `),
            db.query(`
                SELECT
                    COUNT(*) AS total_sellers,
                    COUNT(*) FILTER (WHERE is_active = true AND is_admin = false) AS active_sellers,
                    COUNT(*) FILTER (WHERE kyc_status = 'PENDING') AS pending_kyc
                FROM sellers WHERE is_admin = false
            `),
            db.query(`SELECT COUNT(*) AS total FROM transactions WHERE status = 'DISPUTED'`),
        ]);
        const t = txStats.rows[0];
        const s = sellerStats.rows[0];
        res.json({
            total_transactions: parseInt(t.total_transactions),
            total_volume: parseInt(t.total_volume),
            platform_fees: parseInt(t.platform_fees),
            held_volume: parseInt(t.held_volume),
            released_volume: parseInt(t.released_volume),
            active_orders: parseInt(t.active_orders),
            completed_orders: parseInt(t.completed_orders),
            open_disputes: parseInt(t.open_disputes),
            orders_last_30d: parseInt(t.orders_last_30d),
            total_sellers: parseInt(s.total_sellers),
            active_sellers: parseInt(s.active_sellers),
            pending_kyc: parseInt(s.pending_kyc),
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// List disputes (with search + pagination)
router.get('/disputes', async (req, res) => {
    try {
        const { search, limit = 25, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 25, 200);
        const pageOffset = parseInt(offset) || 0;

        const params = ["DISPUTED"];
        const conditions = ["t.status = $1"];
        if (search) {
            params.push(`%${search}%`);
            const n = params.length;
            conditions.push(`(t.order_ref ILIKE $${n} OR s.full_name ILIKE $${n} OR t.buyer_name ILIKE $${n})`);
        }
        const where = ' WHERE ' + conditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) FROM transactions t JOIN sellers s ON t.seller_id = s.id${where}`, params
        );
        const total = parseInt(countResult.rows[0].count);

        const dataParams = [...params, pageLimit, pageOffset];
        const result = await db.query(
            `SELECT t.*, s.full_name as seller_name, s.phone as seller_phone
             FROM transactions t JOIN sellers s ON t.seller_id = s.id
             ${where} ORDER BY t.updated_at DESC
             LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
        );
        res.json({ disputes: result.rows, total, limit: pageLimit, offset: pageOffset });
    } catch (err) {
        console.error('Admin disputes error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Resolve dispute
router.patch('/disputes/:id/resolve', async (req, res) => {
    try {
        const { decision, notes } = req.body;
        if (!['RELEASE', 'REFUND'].includes(decision)) return res.status(400).json({ error: 'Decision must be RELEASE or REFUND' });
        const result = await db.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const tx = result.rows[0];
        if (decision === 'RELEASE') {
            await escrow.transition(tx.id, 'RELEASED');
            await escrow.releaseFundsToSeller(tx.id);
        } else {
            await escrow.transition(tx.id, 'REFUNDED');
            await sim.refundFunds(tx.id, tx.order_ref, tx.total_amount);
        }
        await db.query('UPDATE transactions SET admin_notes = $1 WHERE id = $2', [notes, tx.id]);
        await audit.log('ADMIN', req.seller.id, `DISPUTE_${decision}`, 'TRANSACTION', tx.id, req.ip, { notes });
        res.json({ message: `Dispute resolved: ${decision}` });
    } catch (err) {
        console.error('Admin resolve dispute error:', err);
        res.status(500).json({ error: err.message });
    }
});

// List all transactions (with global summary)
router.get('/transactions', async (req, res) => {
    try {
        const { status, limit = 25, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 25, 200);
        const pageOffset = parseInt(offset) || 0;

        const params = [];
        let where = '';
        if (status) { params.push(status); where = ` WHERE t.status = $${params.length}`; }

        const [countResult, summaryResult, dataResult] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM transactions t${where}`, params),
            // Global summary — unaffected by status filter
            db.query(`
                SELECT
                    COUNT(*) AS total,
                    COALESCE(SUM(total_amount), 0) AS total_volume,
                    COALESCE(SUM(platform_fee), 0) AS total_fees,
                    COUNT(*) FILTER (WHERE status = 'DISPUTED') AS total_disputes
                FROM transactions
            `),
            db.query(
                `SELECT t.*, s.full_name as seller_name FROM transactions t JOIN sellers s ON t.seller_id = s.id${where} ORDER BY t.created_at DESC LIMIT $${[...params, pageLimit, pageOffset].length - 1} OFFSET $${[...params, pageLimit, pageOffset].length}`,
                [...params, pageLimit, pageOffset]
            ),
        ]);
        const total = parseInt(countResult.rows[0].count);
        const s = summaryResult.rows[0];
        res.json({
            transactions: dataResult.rows,
            total,
            limit: pageLimit,
            offset: pageOffset,
            summary: {
                total_volume: parseInt(s.total_volume),
                total_fees: parseInt(s.total_fees),
                total_disputes: parseInt(s.total_disputes),
            },
        });
    } catch (err) {
        console.error('Admin transactions error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── Verify admin password (gates destructive UI actions) ───────────────────
router.post('/verify-password', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Password required' });
        const result = await db.query('SELECT password_hash FROM sellers WHERE id = $1 AND is_admin = true', [req.seller.id]);
        if (!result.rows.length) return res.status(403).json({ error: 'Admin account not found' });
        const match = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!match) return res.status(401).json({ error: 'Incorrect password' });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sellers list
router.get('/sellers', async (req, res) => {
    try {
        const { search, status, limit = 25, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 25, 200);
        const pageOffset = parseInt(offset) || 0;

        const params = [];
        const conditions = ['is_admin = false'];
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR business_name ILIKE $${params.length})`);
        }
        if (status === 'ACTIVE')    conditions.push('is_active = true');
        if (status === 'SUSPENDED') conditions.push('is_active = false');
        if (status === 'PENDING')   conditions.push("kyc_status = 'PENDING'");
        const where = ' WHERE ' + conditions.join(' AND ');

        const countResult = await db.query(`SELECT COUNT(*) FROM sellers${where}`, params);
        const total = parseInt(countResult.rows[0].count);

        const dataParams = [...params, pageLimit, pageOffset];
        const q = `
            SELECT s.id, s.full_name, s.business_name, s.email, s.phone, s.momo_number,
                   s.kyc_status, s.kyc_tier, s.kyc_document_url, s.is_active, s.seller_score,
                   s.city, s.region, s.last_login_at, s.created_at,
                   COUNT(t.id) FILTER (WHERE t.status NOT IN ('CANCELLED')) AS total_orders,
                   COALESCE(SUM(t.seller_payout_amount) FILTER (WHERE t.status IN ('RELEASED','AUTO_RELEASED')), 0) AS total_revenue
            FROM sellers s
            LEFT JOIN transactions t ON t.seller_id = s.id
            ${where}
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
        `;
        const result = await db.query(q, dataParams);
        res.json({ sellers: result.rows, total, limit: pageLimit, offset: pageOffset });
    } catch (err) {
        console.error('Admin sellers error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Single seller stats (for detail view)
router.get('/sellers/:id/stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE status NOT IN ('CANCELLED')) AS total_orders,
                COUNT(*) FILTER (WHERE status IN ('PAID','SHIPPED')) AS active_orders,
                COUNT(*) FILTER (WHERE status IN ('RELEASED','AUTO_RELEASED')) AS completed_orders,
                COUNT(*) FILTER (WHERE status = 'DISPUTED') AS disputed_orders,
                COALESCE(SUM(seller_payout_amount) FILTER (WHERE status IN ('RELEASED','AUTO_RELEASED')), 0) AS total_revenue
            FROM transactions WHERE seller_id = $1
        `, [req.params.id]);
        res.json(stats.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset seller trust score
router.post('/sellers/:id/reset-score', async (req, res) => {
    try {
        const defaultScore = await settings.getInt('SELLER_DEFAULT_TRUST_SCORE', 50);
        await db.query('UPDATE sellers SET seller_score = $1, updated_at = NOW() WHERE id = $2', [defaultScore, req.params.id]);
        await audit.log('ADMIN', req.seller.id, 'RESET_TRUST_SCORE', 'SELLER', req.params.id, req.ip, { new_score: defaultScore });
        res.json({ message: `Trust score reset to ${defaultScore}`, seller_score: defaultScore });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Unlock seller account (clear login attempts + lock)
router.post('/sellers/:id/unlock', async (req, res) => {
    try {
        await db.query('UPDATE sellers SET login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1', [req.params.id]);
        await audit.log('ADMIN', req.seller.id, 'UNLOCK_SELLER', 'SELLER', req.params.id, req.ip);
        res.json({ message: 'Account unlocked successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset seller location change counter
router.post('/sellers/:id/reset-location', async (req, res) => {
    try {
        await db.query('UPDATE sellers SET location_changes_this_year = 0, updated_at = NOW() WHERE id = $1', [req.params.id]);
        await audit.log('ADMIN', req.seller.id, 'RESET_LOCATION_COUNTER', 'SELLER', req.params.id, req.ip);
        res.json({ message: 'Location change counter reset to 0' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset seller KYC status back to PENDING
router.post('/sellers/:id/reset-kyc', async (req, res) => {
    try {
        await db.query(
            `UPDATE sellers SET kyc_status = 'PENDING', kyc_tier = 1, updated_at = NOW() WHERE id = $1`,
            [req.params.id]
        );
        // Also cancel any approved KYC applications for this seller
        await db.query(
            `UPDATE kyc_applications SET status = 'CANCELLED' WHERE seller_id = $1 AND status = 'APPROVED'`,
            [req.params.id]
        );
        await audit.log('ADMIN', req.seller.id, 'RESET_KYC', 'SELLER', req.params.id, req.ip);
        res.json({ message: 'KYC status reset to PENDING, tier reset to 1' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Suspend / reactivate seller
router.patch('/sellers/:id', async (req, res) => {
    try {
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active (boolean) required' });
        await db.query('UPDATE sellers SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, req.params.id]);
        await audit.log('ADMIN', req.seller.id, is_active ? 'REACTIVATE_SELLER' : 'SUSPEND_SELLER', 'SELLER', req.params.id, req.ip, {});
        res.json({ message: is_active ? 'Seller reactivated' : 'Seller suspended' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const { search, actor_type, entity_type, limit = 25, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 25, 200);
        const pageOffset = parseInt(offset) || 0;

        const conditions = [];
        const params = [];

        if (actor_type) {
            params.push(actor_type);
            conditions.push(`al.actor_type = $${params.length}`);
        }
        if (entity_type) {
            params.push(entity_type);
            conditions.push(`al.entity_type = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            const n = params.length;
            conditions.push(`(al.action ILIKE $${n} OR al.ip_address ILIKE $${n} OR al.entity_id::text ILIKE $${n} OR al.actor_id::text ILIKE $${n})`);
        }
        const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

        // Summary: today's total + per actor_type counts
        const summaryResult = await db.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE actor_type = 'ADMIN') as admin_count,
                COUNT(*) FILTER (WHERE actor_type = 'SELLER') as seller_count,
                COUNT(*) FILTER (WHERE actor_type = 'SYSTEM') as system_count,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as today_count
            FROM audit_logs
        `);
        const summary = summaryResult.rows[0];

        const countResult = await db.query(
            `SELECT COUNT(*) FROM audit_logs al${where}`, params
        );
        const total = parseInt(countResult.rows[0].count);

        const dataParams = [...params, pageLimit, pageOffset];
        const q = `
            SELECT al.*,
                   s.full_name as actor_name, s.email as actor_email
            FROM audit_logs al
            LEFT JOIN sellers s ON al.actor_id::text = s.id::text
            ${where}
            ORDER BY al.created_at DESC
            LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
        `;
        const result = await db.query(q, dataParams);
        res.json({ logs: result.rows, total, summary, limit: pageLimit, offset: pageOffset });
    } catch (err) {
        console.error('Admin audit logs error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Contact enquiries
router.get('/contact-enquiries', async (req, res) => {
    try {
        const { read, search, limit = 20, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 20, 100);
        const pageOffset = parseInt(offset) || 0;
        const conditions = [];
        const params = [];
        if (read === 'true')  { conditions.push(`is_read = TRUE`); }
        if (read === 'false') { conditions.push(`is_read = FALSE`); }
        if (search) { params.push(`%${search}%`); conditions.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length} OR message ILIKE $${params.length} OR subject ILIKE $${params.length})`); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await db.query(`SELECT COUNT(*) FROM contact_enquiries ${where}`, params);
        const total = parseInt(countResult.rows[0].count);
        params.push(pageLimit, pageOffset);
        const result = await db.query(`SELECT * FROM contact_enquiries ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        res.json({ enquiries: result.rows, total, limit: pageLimit, offset: pageOffset });
    } catch (err) {
        console.error('Admin contact enquiries error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/contact-enquiries/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `UPDATE contact_enquiries SET is_read = TRUE WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Enquiry not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Admin enquiry update error:', err);
        res.status(500).json({ error: err.message });
    }
});

// KYC Application Review
router.get('/kyc-applications', async (req, res) => {
    try {
        const { status, search, limit = 20, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 20, 100);
        const pageOffset = parseInt(offset) || 0;

        const conditions = [];
        const params = [];

        if (status) {
            params.push(status);
            conditions.push(`ka.status = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            const n = params.length;
            conditions.push(`(s.full_name ILIKE $${n} OR s.email ILIKE $${n} OR s.phone ILIKE $${n})`);
        }
        if (req.query.seller_id) {
            params.push(req.query.seller_id);
            conditions.push(`ka.seller_id = $${params.length}`);
        }
        const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

        // Summary counts (ignore search/pagination, always all statuses)
        const summaryResult = await db.query(
            `SELECT status, COUNT(*) as count FROM kyc_applications GROUP BY status`
        );
        const summary = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
        summaryResult.rows.forEach(r => { summary[r.status] = parseInt(r.count); });

        const countResult = await db.query(
            `SELECT COUNT(*) FROM kyc_applications ka JOIN sellers s ON ka.seller_id = s.id${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const dataParams = [...params, pageLimit, pageOffset];
        const q = `
            SELECT ka.*,
                   s.full_name as seller_name, s.email as seller_email, s.phone as seller_phone,
                   s.kyc_tier as current_tier, s.seller_score,
                   COALESCE(t.total_orders, 0) as total_orders,
                   COALESCE(t.total_revenue, 0) as total_revenue
            FROM kyc_applications ka
            JOIN sellers s ON ka.seller_id = s.id
            LEFT JOIN (
                SELECT seller_id, COUNT(*) as total_orders,
                       COALESCE(SUM(seller_payout_amount) FILTER (WHERE status IN ('RELEASED','AUTO_RELEASED')), 0) as total_revenue
                FROM transactions
                GROUP BY seller_id
            ) t ON t.seller_id = ka.seller_id
            ${where}
            ORDER BY ka.created_at ASC
            LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
        `;
        const result = await db.query(q, dataParams);
        res.json({ applications: result.rows, total, summary, limit: pageLimit, offset: pageOffset });
    } catch (err) {
        console.error('Admin kyc applications list error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/kyc-applications/:id', async (req, res) => {
    try {
        const { action, rejection_reason } = req.body;
        if (!['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
        }

        const appResult = await db.query('SELECT * FROM kyc_applications WHERE id = $1', [req.params.id]);
        if (appResult.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
        const application = appResult.rows[0];

        if (application.status !== 'PENDING') {
            return res.status(400).json({ error: 'This application has already been reviewed.' });
        }

        // Fetch seller phone for SMS
        const sellerResult = await db.query('SELECT full_name, phone FROM sellers WHERE id = $1', [application.seller_id]);
        const sellerInfo = sellerResult.rows[0] || {};

        if (action === 'APPROVE') {
            await db.query(
                "UPDATE kyc_applications SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by = $1, updated_at = NOW() WHERE id = $2",
                [req.seller.id, req.params.id]
            );
            await db.query(
                'UPDATE sellers SET kyc_tier = $1, kyc_status = $2 WHERE id = $3',
                [application.target_tier, 'APPROVED', application.seller_id]
            );
            await audit.log('ADMIN', req.seller.id, `KYC_APPROVE_TIER_${application.target_tier}`, 'SELLER', application.seller_id, req.ip);
            // Notify seller via SMS
            if (sellerInfo.phone) {
                await notify.sms(sellerInfo.phone,
                    `Hi ${sellerInfo.full_name || 'Seller'}, your SafeDeliver KYC application has been APPROVED. You are now Tier ${application.target_tier}. Your transaction limits have been upgraded.`
                );
            }
            res.json({ message: `Seller upgraded to Tier ${application.target_tier}` });
        } else {
            if (!rejection_reason) return res.status(400).json({ error: 'A rejection reason is required.' });
            await db.query(
                "UPDATE kyc_applications SET status = 'REJECTED', rejection_reason = $1, reviewed_at = NOW(), reviewed_by = $2, updated_at = NOW() WHERE id = $3",
                [rejection_reason, req.seller.id, req.params.id]
            );
            await audit.log('ADMIN', req.seller.id, `KYC_REJECT_TIER_${application.target_tier}`, 'SELLER', application.seller_id, req.ip, { rejection_reason });
            // Notify seller via SMS
            if (sellerInfo.phone) {
                await notify.sms(sellerInfo.phone,
                    `Hi ${sellerInfo.full_name || 'Seller'}, your SafeDeliver KYC application for Tier ${application.target_tier} was not approved. Reason: ${rejection_reason}. Please contact support if you have questions.`
                );
            }
            res.json({ message: 'KYC application rejected' });
        }
    } catch (err) {
        console.error('KYC review error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Simulation Ledger
router.get('/ledger', async (req, res) => {
    try {
        const { type, search, limit = 25, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 25, 200);
        const pageOffset = parseInt(offset) || 0;

        const params = [];
        const conditions = [];
        if (type) { params.push(type); conditions.push(`entry_type = $${params.length}`); }
        if (search) { params.push(`%${search}%`); conditions.push(`order_ref ILIKE $${params.length}`); }
        const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

        const [countResult, summaryResult, dataResult] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM simulation_ledger${where}`, params),
            db.query(`
                SELECT
                    COALESCE(SUM(amount_ghs) FILTER (WHERE entry_type = 'HOLD'),    0) AS total_held,
                    COALESCE(SUM(amount_ghs) FILTER (WHERE entry_type = 'RELEASE'), 0) AS total_released,
                    COALESCE(SUM(amount_ghs) FILTER (WHERE entry_type = 'REFUND'),  0) AS total_refunded,
                    COALESCE(SUM(amount_ghs) FILTER (WHERE entry_type = 'FEE'),     0) AS total_fees
                FROM simulation_ledger
            `),
            db.query(
                `SELECT * FROM simulation_ledger${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, pageLimit, pageOffset]
            ),
        ]);
        const total = parseInt(countResult.rows[0].count);
        const s = summaryResult.rows[0];
        res.json({
            entries: dataResult.rows,
            total,
            limit: pageLimit,
            offset: pageOffset,
            summary: {
                total_held: parseInt(s.total_held),
                total_released: parseInt(s.total_released),
                total_refunded: parseInt(s.total_refunded),
                total_fees: parseInt(s.total_fees),
            },
        });
    } catch (err) {
        console.error('Admin ledger error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Notifications log
router.get('/notifications', async (req, res) => {
    try {
        const { channel, status, search, limit = 25, offset = 0 } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 25, 200);
        const pageOffset = parseInt(offset) || 0;

        const params = [];
        const conditions = [];
        if (channel) { params.push(channel); conditions.push(`channel = $${params.length}`); }
        if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
        if (search) { params.push(`%${search}%`); conditions.push(`(recipient_id ILIKE $${params.length} OR order_ref ILIKE $${params.length})`); }
        const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

        const [countResult, summaryResult, dataResult] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM notifications${where}`, params),
            db.query(`
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE channel = 'SMS') AS total_sms,
                    COUNT(*) FILTER (WHERE channel = 'PUSH') AS total_push,
                    COUNT(*) FILTER (WHERE channel = 'EMAIL') AS total_email,
                    COUNT(*) FILTER (WHERE status = 'FAILED') AS total_failed
                FROM notifications
            `),
            db.query(
                `SELECT * FROM notifications${where} ORDER BY sent_at DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, pageLimit, pageOffset]
            ),
        ]);
        const total = parseInt(countResult.rows[0].count);
        const s = summaryResult.rows[0];
        res.json({
            notifications: dataResult.rows.map(n => ({ ...n, phone: n.recipient_id })),
            total,
            limit: pageLimit,
            offset: pageOffset,
            summary: {
                total: parseInt(s.total),
                total_sms: parseInt(s.total_sms),
                total_push: parseInt(s.total_push),
                total_email: parseInt(s.total_email),
                total_failed: parseInt(s.total_failed),
            },
        });
    } catch (err) {
        console.error('Admin notifications error:', err);
        res.status(500).json({ error: err.message });
    }
});

// System settings — read (with updater name)
router.get('/settings', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ss.key, ss.value, ss.description, ss.updated_at,
                   s.full_name AS updated_by_name
            FROM system_settings ss
            LEFT JOIN sellers s ON ss.updated_by = s.id
            ORDER BY ss.key
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// System settings — update single key
router.patch('/settings/:key', async (req, res) => {
    try {
        const { value } = req.body;
        if (value === undefined || value === null) return res.status(400).json({ error: 'Value required' });
        await db.query(
            `INSERT INTO system_settings (key, value, updated_at, updated_by)
             VALUES ($1, $2, NOW(), $3)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3`,
            [req.params.key, String(value), req.seller.id]
        );
        await audit.log('ADMIN', req.seller.id, 'UPDATE_SETTING', 'SYSTEM', null, req.ip, { key: req.params.key, value });
        settings.invalidate();
        res.json({ message: 'Setting updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// System settings — bulk upsert
router.patch('/settings', async (req, res) => {
    try {
        const { settings } = req.body;
        if (!Array.isArray(settings) || settings.length === 0) return res.status(400).json({ error: 'Settings array required' });
        for (const s of settings) {
            await db.query(
                `INSERT INTO system_settings (key, value, updated_at, updated_by)
                 VALUES ($1, $2, NOW(), $3)
                 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3`,
                [s.key, String(s.value), req.seller.id]
            );
        }
        await audit.log('ADMIN', req.seller.id, 'BULK_UPDATE_SETTINGS', 'SYSTEM', null, req.ip, { count: settings.length });
        require('../services/settings').invalidate();
        res.json({ message: 'Settings saved' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Danger Zone: Clear Notifications ────────────────────────────────────────
// DELETE /admin/data/notifications?before=YYYY-MM-DD  (before is inclusive)
router.delete('/data/notifications', async (req, res) => {
    try {
        const { before } = req.query;
        if (!before) return res.status(400).json({ error: '`before` date query param required (YYYY-MM-DD)' });
        const cutoff = new Date(before);
        if (isNaN(cutoff)) return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        // Set cutoff to end-of-day so "before 2024-06-30" is inclusive of that day
        cutoff.setHours(23, 59, 59, 999);
        const result = await db.query(
            'DELETE FROM notifications WHERE sent_at <= $1',
            [cutoff.toISOString()]
        );
        const count = result.rowCount;
        await audit.log('ADMIN', req.seller.id, 'CLEAR_NOTIFICATIONS', 'SYSTEM', null, req.ip, { before, deleted: count });
        res.json({ message: `Deleted ${count} notification${count !== 1 ? 's' : ''} on or before ${before}.`, deleted: count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Danger Zone: Clear Audit Logs ───────────────────────────────────────────
// DELETE /admin/data/audit-logs?before=YYYY-MM-DD
router.delete('/data/audit-logs', async (req, res) => {
    try {
        const { before } = req.query;
        if (!before) return res.status(400).json({ error: '`before` date query param required (YYYY-MM-DD)' });
        const cutoff = new Date(before);
        if (isNaN(cutoff)) return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        cutoff.setHours(23, 59, 59, 999);
        const result = await db.query(
            'DELETE FROM audit_logs WHERE created_at <= $1',
            [cutoff.toISOString()]
        );
        const count = result.rowCount;
        // Note: we log AFTER deletion so this action itself is recorded
        await audit.log('ADMIN', req.seller.id, 'CLEAR_AUDIT_LOGS', 'SYSTEM', null, req.ip, { before, deleted: count });
        res.json({ message: `Deleted ${count} audit log${count !== 1 ? 's' : ''} on or before ${before}.`, deleted: count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Danger Zone: Nuclear Reset ───────────────────────────────────────────────
// DELETE /admin/data/nuclear
// Wipes all data except admin accounts and system_settings. Irreversible.
router.delete('/data/nuclear', async (req, res) => {
    try {
        const { confirm } = req.body;
        if (confirm !== 'RESET ENTIRE PLATFORM') {
            return res.status(400).json({ error: 'Confirmation text mismatch. Send { confirm: "RESET ENTIRE PLATFORM" } in body.' });
        }

        // Order matters — FK constraints must be respected
        await db.query('DELETE FROM audit_logs');
        await db.query('DELETE FROM notifications');
        await db.query('DELETE FROM contact_enquiries');
        await db.query('DELETE FROM kyc_applications');
        await db.query('DELETE FROM simulation_ledger');  // FK → transactions
        await db.query('DELETE FROM transactions');        // FK → checkout_links → sellers
        // checkout_links cascade-deleted when sellers are removed (ON DELETE CASCADE)
        await db.query('DELETE FROM sellers WHERE is_admin = false OR is_admin IS NULL');

        // Log the nuclear action (audit table was just wiped, but this seeds the first entry)
        await audit.log('ADMIN', req.seller.id, 'NUCLEAR_RESET', 'SYSTEM', null, req.ip, { wiped_at: new Date().toISOString() });

        res.json({ message: 'Platform reset complete. All data wiped. Admin accounts and settings preserved.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
