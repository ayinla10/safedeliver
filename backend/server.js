require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { z } = require('zod');
const path = require('path');
const db = require('./db');
const { generalLimiter } = require('./middleware/rateLimit');
const { startAutoReleaseCron } = require('./services/cron');

const app = express();
const fs = require('fs');

// Trust Render/proxy X-Forwarded-For headers (required for rate limiting behind a proxy)
app.set('trust proxy', 1);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: (origin, callback) => {
        const allowed = [
            'https://safedeliver.vercel.app',
            process.env.FRONTEND_URL,
        ].filter(Boolean);
        
        // Always allow localhost in development
        if (process.env.NODE_ENV === 'development') {
            allowed.push('http://localhost:3000');
        }

        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowed.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            console.warn(`🚨 CORS Blocked: Access attempted from unauthorized origin: ${origin}`);
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(generalLimiter);

// Serve uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// File upload via Supabase Storage
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Extract Supabase project URL from DATABASE_URL or use env var
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Use memory storage — file goes to Supabase, not disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'));
    }
});

// Upload endpoint — stores in Supabase Storage or Local Fallback
app.post('/api/v1/upload', require('./middleware/auth').authenticateSeller, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const ext = path.extname(req.file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

        if (supabase) {
            // Supabase Upload
            const { error } = await supabase.storage
                .from('safedeliver-uploads')
                .upload(filename, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });
            if (error) throw error;
            const { data } = supabase.storage.from('safedeliver-uploads').getPublicUrl(filename);
            return res.json({ url: data.publicUrl });
        } else {
            // Local Fallback
            const fs = require('fs');
            const fsPath = path.join(__dirname, 'uploads', filename);
            fs.writeFileSync(fsPath, req.file.buffer);
            
            // Generate local URL (using host from request)
            const host = req.get('host');
            const protocol = req.protocol;
            const url = `${protocol}://${host}/uploads/${filename}`;
            console.log('Using Local Storage Fallback:', url);
            return res.json({ url });
        }
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// One-time migration endpoint — protected by secret key
app.get('/api/v1/migrate', async (req, res) => {
    const secret = req.headers['x-migrate-secret'] || req.query.secret;
    if (!secret || secret !== process.env.MIGRATE_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }
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
app.use('/api/v1/pay', require('./routes/pay'));
app.use('/api/v1/push', require('./routes/push'));

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
