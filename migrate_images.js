require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/db');

async function migrate() {
    console.log('Starting migration: Adding images column to checkout_links...');
    try {
        await db.query(`
            ALTER TABLE checkout_links 
            ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
        `);
        console.log('Migration successful: images column added.');
        
        // Populate 'images' with the value from 'image_url' for existing links
        console.log('Backfilling images from image_url...');
        await db.query(`
            UPDATE checkout_links 
            SET images = jsonb_build_array(image_url)
            WHERE image_url IS NOT NULL AND (images IS NULL OR images = '[]');
        `);
        console.log('Backfill successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
