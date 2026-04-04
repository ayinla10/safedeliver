const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { z } = require('zod');
const db = require('../db');
const { authenticateSeller } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const notify = require('../services/notify');
const audit = require('../services/audit');

// Normalize Ghana phone: accept 0241234567, 241234567, +233241234567, 233241234567 → 0241234567
function normalizePhone(raw) {
    let p = raw.replace(/[\s\-()]/g, '');
    if (p.startsWith('+233')) p = '0' + p.slice(4);
    else if (p.startsWith('233') && p.length > 10) p = '0' + p.slice(3);
    else if (!p.startsWith('0') && p.length === 9) p = '0' + p;
    return p;
}

// Register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const schema = z.object({ full_name: z.string().min(2), email: z.string().email(), phone: z.string().min(1), password: z.string().min(8) });
        const data = schema.parse(req.body);
        data.phone = normalizePhone(data.phone);
        if (!/^0[0-9]{9}$/.test(data.phone)) {
            return res.status(400).json({ error: 'Invalid Ghana phone number. Expected 10 digits starting with 0 (e.g. 0241234567).' });
        }
        const exists = await db.query('SELECT id FROM sellers WHERE phone = $1 OR email = $2', [data.phone, data.email]);
        if (exists.rows.length > 0) return res.status(409).json({ error: 'Phone or email already registered' });
        const hash = await bcrypt.hash(data.password, 12);
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const id = uuid();
        await db.query(
            `INSERT INTO sellers (id, full_name, email, phone, password_hash, otp_code, otp_expires_at) VALUES ($1,$2,$3,$4,$5,$6, NOW() + INTERVAL '10 minutes')`,
            [id, data.full_name, data.email, data.phone, hash, otp]
        );
        console.log(`\n📱 OTP for ${data.phone}: ${otp}\n`);
        await notify.sms(data.phone, `Your SafeDeliver OTP is: ${otp}. Expires in 10 minutes.`);
        await audit.log('SELLER', id, 'REGISTER', 'SELLER', id, req.ip);
        res.status(201).json({ message: 'Account created. Please verify your phone.', phone: data.phone });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const normalized = normalizePhone(phone || '');
        const result = await db.query('SELECT * FROM sellers WHERE phone = $1 OR email = $1', [normalized || phone]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        const seller = result.rows[0];
        if (seller.otp_code !== otp || new Date(seller.otp_expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        await db.query('UPDATE sellers SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1', [seller.id]);
        const token = jwt.sign({ id: seller.id, is_admin: seller.is_admin }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '1h' });
        const refreshToken = jwt.sign({ id: seller.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
        res.json({ accessToken: token, refreshToken, seller: { id: seller.id, full_name: seller.full_name, email: seller.email, phone: seller.phone } });
    } catch (err) {
        console.error('OTP verify error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Resend OTP
router.post('/resend-otp', authLimiter, async (req, res) => {
    try {
        const raw = req.body.phone || '';
        const phone = normalizePhone(raw);
        const result = await db.query('SELECT * FROM sellers WHERE phone = $1 OR email = $1', [phone || raw]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        const seller = result.rows[0];
        if (seller.is_verified) return res.status(400).json({ error: 'Account is already verified. Please login.' });
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await db.query(
            `UPDATE sellers SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
            [otp, seller.id]
        );
        console.log(`\n📱 RESEND OTP for ${phone}: ${otp}\n`);
        await notify.sms(phone, `Your SafeDeliver OTP is: ${otp}. Expires in 10 minutes.`);
        res.json({ message: 'New OTP sent', phone });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ error: 'Failed to resend OTP' });
    }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
    try {
        let { phone, password } = req.body;
        // Try to normalize if it looks like a phone number (not an email)
        const loginId = phone.includes('@') ? phone : normalizePhone(phone);
        const result = await db.query('SELECT * FROM sellers WHERE phone = $1 OR email = $1', [loginId]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const seller = result.rows[0];
        if (seller.locked_until && new Date(seller.locked_until) > new Date()) {
            return res.status(423).json({ error: 'Account locked. Try again later.' });
        }
        if (!seller.is_verified) {
            // Auto-resend OTP for unverified accounts
            const otp = String(Math.floor(100000 + Math.random() * 900000));
            await db.query(
                `UPDATE sellers SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
                [otp, seller.id]
            );
            console.log(`\n📱 AUTO-RESEND OTP for ${seller.phone}: ${otp}\n`);
            await notify.sms(seller.phone, `Your SafeDeliver OTP is: ${otp}. Expires in 10 minutes.`);
            return res.status(403).json({ error: 'Account not verified. A new OTP has been sent to your phone.', phone: seller.phone, needsVerify: true });
        }
        const valid = await bcrypt.compare(password, seller.password_hash);
        if (!valid) {
            const attempts = (seller.login_attempts || 0) + 1;
            const lockUntil = attempts >= 5 ? `NOW() + INTERVAL '30 minutes'` : 'NULL';
            await db.query(`UPDATE sellers SET login_attempts = $1, locked_until = ${lockUntil} WHERE id = $2`, [attempts, seller.id]);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        await db.query('UPDATE sellers SET login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1', [seller.id]);
        const token = jwt.sign({ id: seller.id, is_admin: seller.is_admin }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '1h' });
        const refreshToken = jwt.sign({ id: seller.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
        await audit.log('SELLER', seller.id, 'LOGIN', 'SELLER', seller.id, req.ip);
        res.json({ accessToken: token, refreshToken, seller: { id: seller.id, full_name: seller.full_name, email: seller.email, phone: seller.phone, is_admin: seller.is_admin } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const result = await db.query('SELECT id, is_admin FROM sellers WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid token' });
        const seller = result.rows[0];
        const token = jwt.sign({ id: seller.id, is_admin: seller.is_admin }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '1h' });
        const newRefresh = jwt.sign({ id: seller.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
        res.json({ accessToken: token, refreshToken: newRefresh });
    } catch { res.status(401).json({ error: 'Invalid refresh token' }); }
});

// Logout (client-side)
router.post('/logout', authenticateSeller, (req, res) => { res.json({ message: 'Logged out' }); });

module.exports = router;
