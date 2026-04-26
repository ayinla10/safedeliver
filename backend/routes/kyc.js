const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateSeller } = require('../middleware/auth');
const kycVerify = require('../services/kyc-verify');

// ── GET Current KYC Status & Active Limits ──
router.get('/', authenticateSeller, async (req, res) => {
    try {
        const seller = await db.query('SELECT kyc_tier FROM sellers WHERE id = $1', [req.seller.id]);
        const kycTier = seller.rows[0].kyc_tier;

        // Fetch application history
        const apps = await db.query(
            'SELECT * FROM kyc_applications WHERE seller_id = $1 ORDER BY created_at DESC',
            [req.seller.id]
        );
        const latestApp = apps.rows[0] || null;

        // Fetch limits for the user's current tier
        const settings = await db.query('SELECT key, value FROM system_settings WHERE key LIKE $1', [`TIER_${kycTier}_%`]);
        const limits = {};
        settings.rows.forEach(r => limits[r.key] = r.value);

        res.json({
            current_tier: kycTier,
            limits,
            application: latestApp,
            attempts_count: apps.rows.length
        });
    } catch (err) {
        console.error('KYC GET error:', err);
        res.status(500).json({ error: 'Failed to fetch KYC data' });
    }
});

// ── POST Apply for KYC Upgrade ──
router.post('/apply', authenticateSeller, async (req, res) => {
    try {
        const { target_tier, gov_id_url, selfie_url, proof_of_address_url } = req.body;
        
        const sellerRes = await db.query('SELECT kyc_tier FROM sellers WHERE id = $1', [req.seller.id]);
        const currentTier = sellerRes.rows[0].kyc_tier;
 
        // Strict unskippable verification checks
        if (target_tier !== currentTier + 1) {
            return res.status(400).json({ error: `You must apply for Tier ${currentTier + 1} next. Cannot skip. `});
        }
        if (target_tier > 3) {
            return res.status(400).json({ error: 'Tier 3 is the maximum tier.' });
        }

        // Check for existing pending applicaton
        const pending = await db.query(
            "SELECT id FROM kyc_applications WHERE seller_id = $1 AND status = 'PENDING'",
            [req.seller.id]
        );
        if (pending.rows.length > 0) {
            return res.status(400).json({ error: 'You already have a pending KYC application.' });
        }

        // Validate document requirements
        if (target_tier === 2 && (!gov_id_url || !selfie_url)) {
            return res.status(400).json({ error: 'Government ID and Selfie are required for Tier 2.' });
        }
        if (target_tier === 3 && !proof_of_address_url) {
            return res.status(400).json({ error: 'Proof of Address is required for Tier 3.' });
        }

        const insertRes = await db.query(`
            INSERT INTO kyc_applications (seller_id, target_tier, gov_id_url, selfie_url, proof_of_address_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [req.seller.id, target_tier, gov_id_url || null, selfie_url || null, proof_of_address_url || null]);

        const appId = insertRes.rows[0].id;

        // Manual background verification is no longer needed as per user request
        // All applications will be reviewed manually by admins
        
        res.status(201).json({ message: 'KYC application submitted', applicationId: appId });
    } catch (err) {
        console.error('KYC Apply error:', err);
        res.status(500).json({ error: 'Failed to submit KYC application' });
    }
});

module.exports = router;
