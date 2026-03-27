require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { z } = require('zod');
const db = require('./db');
const { generalLimiter } = require('./middleware/rateLimit');
const { startAutoReleaseCron } = require('./services/cron');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// Routes
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads dir exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'));
        }
    }
});

// Serve uploads statically with cross-origin headers
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// General unified upload route map
app.post('/api/v1/upload', require('./middleware/auth').authenticateSeller, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}` });
});

// One-time migration endpoint (safe to run multiple times)
app.get('/api/v1/migrate', async (req, res) => {
    try {
        const migrate = require('./db/migrate');
        await migrate();
        res.json({ message: 'Migration complete — all tables are ready.' });
    } catch (err) {
        console.error('Migration error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/checkout-links', require('./routes/checkoutLinks'));
app.use('/api/v1/transactions', require('./routes/transactions'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/kyc', require('./routes/kyc'));

// Contact form (public)
app.post('/api/v1/contact', async (req, res) => {
    try {
        const schema = z.object({
            full_name: z.string().min(2).max(200),
            email: z.string().email(),
            phone: z.string().max(20).optional(),
            user_type: z.enum(['Seller', 'Buyer', 'Researcher', 'Press', 'Other']),
            subject: z.string().min(3).max(300),
            message: z.string().min(20).max(5000),
        });

        const data = schema.parse(req.body);
        await db.query(
            `INSERT INTO contact_enquiries (full_name, email, phone, user_type, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [data.full_name, data.email, data.phone || null, data.user_type, data.subject, data.message]
        );

        // Notify admin
        const notify = require('./services/notify');
        await notify.email(
            process.env.ADMIN_EMAIL,
            `New Enquiry: ${data.subject}`,
            `<h2>New Contact Enquiry</h2>
       <p><strong>From:</strong> ${data.full_name} (${data.email})</p>
       <p><strong>Type:</strong> ${data.user_type}</p>
       <p><strong>Subject:</strong> ${data.subject}</p>
       <p>${data.message}</p>`
        );

        res.status(201).json({ message: 'Enquiry submitted successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('Contact form error:', err);
        res.status(500).json({ error: 'Failed to submit enquiry' });
    }
});

// Seller profile endpoint
app.get('/api/v1/seller/profile', require('./middleware/auth').authenticateSeller, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, full_name, email, phone, business_name, kyc_status, kyc_tier, kyc_document_url, momo_number, is_active, seller_score, city, region, pickup_description, location_changes_this_year, location_change_year, created_at, last_login_at
       FROM sellers WHERE id = $1`,
            [req.seller.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Seller not found' });
        const seller = result.rows[0];
        // Reset yearly count if year changed
        const currentYear = new Date().getFullYear();
        if (seller.location_change_year && seller.location_change_year !== currentYear) {
            seller.location_changes_this_year = 0;
        }
        res.json(seller);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update seller profile
app.patch('/api/v1/seller/profile', require('./middleware/auth').authenticateSeller, async (req, res) => {
    try {
        const { full_name, momo_number, business_name } = req.body;
        const result = await db.query(
            `UPDATE sellers SET full_name = COALESCE($1, full_name), momo_number = COALESCE($2, momo_number), business_name = COALESCE($3, business_name), updated_at = NOW()
       WHERE id = $4 RETURNING id, full_name, email, phone, business_name, kyc_status, momo_number, seller_score`,
            [full_name, momo_number, business_name, req.seller.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update seller location (max 2/year)
app.patch('/api/v1/seller/location', require('./middleware/auth').authenticateSeller, async (req, res) => {
    try {
        const { city, region, pickup_description } = req.body;
        if (!city || !region) return res.status(400).json({ error: 'City and region required' });

        const seller = await db.query('SELECT location_changes_this_year, location_change_year FROM sellers WHERE id = $1', [req.seller.id]);
        const s = seller.rows[0];
        const currentYear = new Date().getFullYear();
        let changesThisYear = s.location_changes_this_year || 0;
        if (s.location_change_year !== currentYear) changesThisYear = 0;

        if (changesThisYear >= 2) {
            return res.status(400).json({ error: 'You can only change your location twice per year' });
        }

        await db.query(
            `UPDATE sellers SET city = $1, region = $2, pickup_description = $3, location_changes_this_year = $4, location_change_year = $5, last_location_change_at = NOW(), updated_at = NOW() WHERE id = $6`,
            [city, region, pickup_description || null, changesThisYear + 1, currentYear, req.seller.id]
        );

        // Notify buyers with open unpaid orders from this seller
        const openOrders = await db.query(
            `SELECT buyer_phone, order_ref, buyer_token FROM transactions WHERE seller_id = $1 AND status IN ('REQUESTED','QUOTED')`,
            [req.seller.id]
        );
        const notify = require('./services/notify');
        for (const o of openOrders.rows) {
            await notify.sms(o.buyer_phone, `📍 The seller for order ${o.order_ref} has updated their location to ${city}, ${region}. View: ${process.env.FRONTEND_URL}/track/${o.buyer_token}`, null, o.order_ref);
        }

        res.json({ message: 'Location updated', changes_remaining: 2 - (changesThisYear + 1) });
    } catch (err) {
        console.error('Location update error:', err);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Seller dashboard stats
app.get('/api/v1/seller/stats', require('./middleware/auth').authenticateSeller, async (req, res) => {
    try {
        const stats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('REQUESTED','CANCELLED')) as total_orders,
        COUNT(*) FILTER (WHERE status IN ('PAID', 'SHIPPED')) as active_orders,
        COUNT(*) FILTER (WHERE status = 'REQUESTED') as pending_quotes,
        COUNT(*) FILTER (WHERE status = 'PAID') as pending_shipments,
        COALESCE(SUM(seller_payout_amount) FILTER (WHERE status IN ('RELEASED', 'AUTO_RELEASED')), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('PAID', 'SHIPPED')), 0) as escrow_balance
      FROM transactions WHERE seller_id = $1
    `, [req.seller.id]);

        const sellerResult = await db.query('SELECT seller_score FROM sellers WHERE id = $1', [req.seller.id]);
        const result = stats.rows[0];
        result.seller_score = sellerResult.rows[0]?.seller_score || 100;
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 SafeDeliver API v2.0 running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

    // Start cron
    startAutoReleaseCron();
});

module.exports = app;
