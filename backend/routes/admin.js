const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const escrow = require('../services/escrow');
const sim = require('../services/simulationEngine');
const audit = require('../services/audit');

// All admin routes require admin auth
router.use(authenticateAdmin);

// List disputes
router.get('/disputes', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.*, s.full_name as seller_name, s.phone as seller_phone
             FROM transactions t JOIN sellers s ON t.seller_id = s.id WHERE t.status = 'DISPUTED' ORDER BY t.updated_at DESC`
        );
        res.json(result.rows);
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

// List all transactions
router.get('/transactions', async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        let q = 'SELECT t.*, s.full_name as seller_name FROM transactions t JOIN sellers s ON t.seller_id = s.id';
        const params = [];
        if (status) { q += ' WHERE t.status = $1'; params.push(status); }
        q += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));
        const result = await db.query(q, params);
        res.json({ transactions: result.rows });
    } catch (err) {
        console.error('Admin transactions error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Sellers list
router.get('/sellers', async (req, res) => {
    try {
        const result = await db.query('SELECT id, full_name, email, phone, kyc_status, kyc_tier, kyc_document_url, is_active, seller_score, created_at FROM sellers WHERE is_admin = false ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Admin sellers error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        console.error('Admin audit logs error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Contact enquiries
router.get('/contact-enquiries', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM contact_enquiries ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Admin contact enquiries error:', err);
        res.status(500).json({ error: err.message });
    }
});

// KYC Application Review
router.get('/kyc-applications', async (req, res) => {
    try {
        const { status } = req.query;
        let q = `SELECT ka.*, s.full_name as seller_name, s.email as seller_email, s.phone as seller_phone, s.kyc_tier as current_tier
                 FROM kyc_applications ka JOIN sellers s ON ka.seller_id = s.id`;
        const params = [];
        if (status) {
            params.push(status);
            q += ` WHERE ka.status = $${params.length}`;
        }
        q += ' ORDER BY ka.created_at DESC LIMIT 100';
        const result = await db.query(q, params);
        res.json(result.rows);
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
            res.json({ message: `Seller upgraded to Tier ${application.target_tier}` });
        } else {
            if (!rejection_reason) return res.status(400).json({ error: 'A rejection reason is required.' });
            await db.query(
                "UPDATE kyc_applications SET status = 'REJECTED', rejection_reason = $1, reviewed_at = NOW(), reviewed_by = $2, updated_at = NOW() WHERE id = $3",
                [rejection_reason, req.seller.id, req.params.id]
            );
            await audit.log('ADMIN', req.seller.id, `KYC_REJECT_TIER_${application.target_tier}`, 'SELLER', application.seller_id, req.ip, { rejection_reason });
            res.json({ message: 'KYC application rejected' });
        }
    } catch (err) {
        console.error('KYC review error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
