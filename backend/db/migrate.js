require('dotenv').config();
const db = require('./index');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

async function migrate() {
  console.log('🔄 Running SafeDeliver database migrations...\n');

  const tables = `
    CREATE TABLE IF NOT EXISTS sellers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(200) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      kyc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING','APPROVED','REJECTED','SUSPENDED')),
      momo_number VARCHAR(20),
      is_active BOOLEAN DEFAULT true,
      is_admin BOOLEAN DEFAULT false,
      otp_code VARCHAR(6),
      otp_expires_at TIMESTAMPTZ,
      is_verified BOOLEAN DEFAULT false,
      login_attempts INT DEFAULT 0,
      locked_until TIMESTAMPTZ,
      reset_token TEXT,
      reset_expires_at TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      business_name VARCHAR(200),
      seller_score INT DEFAULT 100,
      city TEXT,
      region TEXT,
      pickup_description TEXT,
      location_changes_this_year INT DEFAULT 0,
      last_location_change_at TIMESTAMPTZ,
      location_change_year INT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS checkout_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
      link_code VARCHAR(10) UNIQUE NOT NULL,
      product_name VARCHAR(300) NOT NULL,
      description TEXT,
      price INT NOT NULL CHECK (price > 0),
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      order_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_ref VARCHAR(20) UNIQUE NOT NULL,
      checkout_link_id UUID REFERENCES checkout_links(id),
      seller_id UUID REFERENCES sellers(id),
      buyer_name VARCHAR(200) NOT NULL,
      buyer_phone VARCHAR(20) NOT NULL,
      buyer_email VARCHAR(255),
      buyer_address TEXT,
      buyer_lat DOUBLE PRECISION,
      buyer_lng DOUBLE PRECISION,
      buyer_location_text TEXT,
      buyer_token TEXT UNIQUE,
      product_name VARCHAR(300) NOT NULL,
      total_amount INT NOT NULL DEFAULT 0,
      delivery_fee INT DEFAULT 0,
      delivery_type VARCHAR(20) DEFAULT 'SELLER' CHECK (delivery_type IN ('SELLER','SELF')),
      platform_fee INT NOT NULL DEFAULT 0,
      seller_payout_amount INT NOT NULL DEFAULT 0,
      pickup_lat DOUBLE PRECISION,
      pickup_lng DOUBLE PRECISION,
      pickup_location_text TEXT,
      status VARCHAR(20) DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','QUOTED','ACCEPTED','PAID','SHIPPED','DELIVERED','RELEASED','AUTO_RELEASED','DISPUTED','REFUNDED','CANCELLED')),
      sim_reference TEXT,
      paystack_reference TEXT,
      tracking_number VARCHAR(100),
      dispute_reason TEXT,
      dispute_details TEXT,
      admin_notes TEXT,
      quoted_at TIMESTAMPTZ,
      quote_deadline TIMESTAMPTZ,
      paid_at TIMESTAMPTZ,
      shipped_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      released_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS simulation_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id UUID REFERENCES transactions(id),
      order_ref VARCHAR(20),
      entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('HOLD','RELEASE','REFUND','FEE')),
      amount_ghs INT NOT NULL,
      balance_after INT DEFAULT 0,
      reference TEXT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id UUID REFERENCES transactions(id),
      order_ref VARCHAR(20),
      channel VARCHAR(20) NOT NULL,
      recipient_id VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_type VARCHAR(20) NOT NULL,
      actor_id UUID,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      ip_address VARCHAR(50),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contact_enquiries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(200) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      user_type VARCHAR(50),
      subject VARCHAR(300) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by UUID REFERENCES sellers(id)
    );

    CREATE TABLE IF NOT EXISTS seller_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
      seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
      buyer_name VARCHAR(200) NOT NULL,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(transaction_id)
    );

    CREATE TABLE IF NOT EXISTS kyc_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
      target_tier INT NOT NULL CHECK (target_tier IN (2, 3)),
      status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
      gov_id_url TEXT,
      selfie_url TEXT,
      proof_of_address_url TEXT,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID REFERENCES sellers(id)
    );

    CREATE TABLE IF NOT EXISTS web_push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      subscription JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await db.query(tables);
  console.log('✅ All 7 tables created successfully');

  // Add new columns to existing tables (safe — IF NOT EXISTS / try-catch)
  const alterations = [
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS seller_score INT DEFAULT 100`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS city TEXT`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS region TEXT`,
    `ALTER TABLE sellers ALTER COLUMN city TYPE TEXT USING city::TEXT`,
    `ALTER TABLE sellers ALTER COLUMN region TYPE TEXT USING region::TEXT`,
    `ALTER TABLE sellers ALTER COLUMN pickup_description TYPE TEXT USING pickup_description::TEXT`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pickup_description TEXT`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS location_changes_this_year INT DEFAULT 0`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS last_location_change_at TIMESTAMPTZ`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS location_change_year INT`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_name VARCHAR(200)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delivery_fee INT DEFAULT 0`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'SELLER'`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_lat DOUBLE PRECISION`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_lng DOUBLE PRECISION`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_location_text TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pickup_location_text TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS quote_deadline TIMESTAMPTZ`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS kyc_tier INT DEFAULT 1`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(255)`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS seller_lat DOUBLE PRECISION`,
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS seller_lng DOUBLE PRECISION`,
    `ALTER TABLE kyc_applications ADD COLUMN IF NOT EXISTS auto_verify_score DECIMAL`,
    `ALTER TABLE kyc_applications ADD COLUMN IF NOT EXISTS ocr_data JSONB`,
    `ALTER TABLE kyc_applications ADD COLUMN IF NOT EXISTS is_auto_verified BOOLEAN DEFAULT false`,
    `ALTER TABLE kyc_applications ADD COLUMN IF NOT EXISTS verification_error TEXT`,
  ];

  for (let alt of alterations) {
    try {
      await db.query(alt);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn(`Warning on alteration: ${alt.substring(0, 50)}... ->`, err.message);
      }
    }
  }
  
  // Seed default KYC tier limits into system_settings
  const newSystemSettings = [
    ['TIER_1_TX_LIMIT', '1000', 'Maximum single transaction value (GHS) for Tier 1'],
    ['TIER_2_TX_LIMIT', '5000', 'Maximum single transaction value (GHS) for Tier 2'],
    ['TIER_3_TX_LIMIT', '0', 'Maximum single transaction value (GHS) for Tier 3 (0=Unlimited)'],
    ['TIER_1_WITHDRAWAL_LIMIT', '5000', 'Maximum weekly withdrawal (GHS) for Tier 1'],
    ['TIER_2_WITHDRAWAL_LIMIT', '20000', 'Maximum weekly withdrawal (GHS) for Tier 2'],
    ['TIER_3_WITHDRAWAL_LIMIT', '0', 'Maximum weekly withdrawal (GHS) for Tier 3 (0=Unlimited)'],
    ['TIER_1_FEATURES', 'basic_links', 'Comma-separated feature flags for Tier 1'],
    ['TIER_2_FEATURES', 'basic_links,api_access', 'Comma-separated feature flags for Tier 2'],
    ['TIER_3_FEATURES', 'basic_links,api_access,priority_support', 'Comma-separated feature flags for Tier 3']
  ];

  for (let [k, v, desc] of newSystemSettings) {
    await db.query(`
      INSERT INTO system_settings (key, value, description) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (key) DO NOTHING
    `, [k, v, desc]);
  }

  console.log('✅ Alterations and System Setting seeds applied.');

  // Update status constraint to include new values
  try {
    await db.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check`);
    await db.query(`ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('REQUESTED','QUOTED','ACCEPTED','INITIATED','PAID','SHIPPED','DELIVERED','RELEASED','AUTO_RELEASED','DISPUTED','REFUNDED','CANCELLED'))`);
    console.log('✅ Status constraint updated');
  } catch (e) { console.log('ℹ️  Status constraint already correct'); }

  // Update delivery_type constraint
  try {
    await db.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_delivery_type_check`);
    await db.query(`ALTER TABLE transactions ADD CONSTRAINT transactions_delivery_type_check CHECK (delivery_type IN ('SELLER','SELF'))`);
  } catch (e) { /* already exists */ }

  // Remove delivery_fee from checkout_links if it exists
  try {
    await db.query(`ALTER TABLE checkout_links DROP COLUMN IF EXISTS delivery_fee`);
    console.log('✅ Removed delivery_fee from checkout_links');
  } catch (e) { /* already removed */ }

  // Add refresh_token_hash for server-side token revocation
  try {
    await db.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT`);
    console.log('✅ Added refresh_token_hash to sellers');
  } catch (e) { /* already exists */ }

  // Add images column to checkout_links (multi-image support)
  try {
    await db.query(`ALTER TABLE checkout_links ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`);
    console.log('✅ Added images column to checkout_links');
  } catch (e) { /* already exists */ }

  // Performance indexes — safe to re-run (IF NOT EXISTS)
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_transactions_seller_id   ON transactions(seller_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_status       ON transactions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_order_ref    ON transactions(order_ref)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_buyer_token  ON transactions(buyer_token)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_paystack_ref ON transactions(paystack_reference)`,
    `CREATE INDEX IF NOT EXISTS idx_checkout_links_code       ON checkout_links(link_code)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_recipient   ON notifications(recipient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_actor          ON audit_logs(actor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at     ON audit_logs(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_sellers_email             ON sellers(email)`,
    `CREATE INDEX IF NOT EXISTS idx_sellers_phone             ON sellers(phone)`,
  ];
  for (const idx of indexes) {
    try { await db.query(idx); } catch (e) { /* already exists */ }
  }
  console.log('✅ Performance indexes applied');

  // Seed default system settings
  const defaultSettings = [
    { key: 'TIER_1_LIMIT', value: '1000', description: 'Max transaction value (GHS) for Tier 1 sellers' },
    { key: 'TIER_2_LIMIT', value: '5000', description: 'Max transaction value (GHS) for Tier 2 sellers' },
    { key: 'TIER_3_LIMIT', value: '0', description: 'Max transaction value (GHS) for Tier 3 sellers (0 = Unlimited)' }
  ];
  for (const s of defaultSettings) {
    await db.query(`INSERT INTO system_settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING`, [s.key, s.value, s.description]);
  }
  console.log('✅ Default system settings seeded');

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@safedeliver.co';
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) throw new Error('ADMIN_PASSWORD env var is required to seed the admin account. Set it and re-run.');
  const existing = await db.query('SELECT id FROM sellers WHERE email = $1', [adminEmail]);
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(adminPw, 12);
    await db.query(
      `INSERT INTO sellers (id, full_name, email, phone, password_hash, is_admin, is_verified, kyc_status)
       VALUES ($1, $2, $3, $4, $5, true, true, 'APPROVED')`,
      [uuid(), 'SafeDeliver Admin', adminEmail, '+233000000000', hash]
    );
    console.log('✅ Admin account seeded:', adminEmail);
  } else {
    console.log('ℹ️  Admin account already exists');
  }

  console.log('\n Migration complete!\n');
}

module.exports = migrate;

// Run directly via CLI: node db/migrate.js
if (require.main === module) {
  migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
}
