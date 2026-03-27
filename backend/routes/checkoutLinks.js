const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authenticateSeller } = require('../middleware/auth');

const FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5');

function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

// List seller's links
router.get('/', authenticateSeller, async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM checkout_links WHERE seller_id = $1 ORDER BY created_at DESC', [req.seller.id]);
        res.json(result.rows);
    } catch (err) { next(err); }
});

// Create link (no delivery_fee — seller quotes per order)
router.post('/', authenticateSeller, async (req, res) => {
    try {
        const { product_name, description, price, image_url } = req.body;
        if (!product_name || !price) return res.status(400).json({ error: 'Product name and price required' });
        const id = uuid();
        const linkCode = genCode();
        await db.query(
            `INSERT INTO checkout_links (id, seller_id, link_code, product_name, description, price, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [id, req.seller.id, linkCode, product_name, description || null, price, image_url || null]
        );
        res.status(201).json({ id, link_code: linkCode, product_name, price, fee_percent: FEE_PERCENT });
    } catch (err) {
        console.error('Create link error:', err);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// Get single link (include seller city/region for buyers)
router.get('/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT cl.*, s.full_name as seller_name, s.city as seller_city, s.region as seller_region
             FROM checkout_links cl JOIN sellers s ON cl.seller_id = s.id WHERE cl.link_code = $1`,
            [req.params.code]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Link not found' });
        const link = result.rows[0];
        link.fee_percent = FEE_PERCENT;
        res.json(link);
    } catch (err) { next(err); }
});

// Update link (no delivery_fee)
router.patch('/:code', authenticateSeller, async (req, res, next) => {
    try {
        const { product_name, description, price, image_url, is_active } = req.body;
        await db.query(
            `UPDATE checkout_links SET product_name = COALESCE($1, product_name), description = COALESCE($2, description),
             price = COALESCE($3, price), image_url = COALESCE($4, image_url),
             is_active = COALESCE($5, is_active), updated_at = NOW() WHERE link_code = $6 AND seller_id = $7`,
            [product_name, description, price, image_url, is_active, req.params.code, req.seller.id]
        );
        res.json({ message: 'Updated' });
    } catch (err) { next(err); }
});

// Delete link
router.delete('/:code', authenticateSeller, async (req, res, next) => {
    try {
        await db.query('DELETE FROM checkout_links WHERE link_code = $1 AND seller_id = $2', [req.params.code, req.seller.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
