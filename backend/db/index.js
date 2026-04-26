const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 15, // Keep within Supabase free tier limits
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Wait 10s for connection before timing out
    ssl: { rejectUnauthorized: false }
});

// Handle pool errors to prevent process crashes
pool.on('error', (err) => {
    console.error('🚨 Unexpected database pool error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
