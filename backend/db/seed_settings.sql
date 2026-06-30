-- Run once in Supabase SQL editor to seed all platform settings.
-- Safe: ON CONFLICT DO NOTHING means existing values are never overwritten.

INSERT INTO system_settings (key, value, description) VALUES
  -- Platform Fees
  ('FEE_ESCROW_PERCENT',  '2.5',  'Escrow fee charged to buyer (percentage)'),
  ('FEE_PAYOUT_PERCENT',  '1.0',  'Fee deducted from seller payout (percentage)'),
  ('FEE_DISPUTE_FLAT',    '5.00', 'Flat admin fee charged when a dispute is raised (GHS)'),

  -- Escrow Rules
  ('ESCROW_AUTO_RELEASE_DAYS',     '5',  'Days after SHIPPED before funds auto-release to seller'),
  ('ESCROW_DISPUTE_WINDOW_HOURS',  '48', 'Hours after delivery confirmation buyer can raise a dispute'),
  ('ESCROW_MAX_DISPUTE_EXTENSIONS','2',  'Max times a dispute resolution deadline can be extended'),

  -- Seller Defaults
  ('SELLER_DEFAULT_TRUST_SCORE', '50', 'Trust score assigned to every new seller (out of 100)'),
  ('SELLER_GRACE_PERIOD_DAYS',   '7',  'Days before strict tier limits are enforced on new accounts'),

  -- Notification Channels
  ('NOTIFY_SMS_ENABLED',   'true',  'Send real SMS via Africa''s Talking'),
  ('NOTIFY_EMAIL_ENABLED', 'true',  'Send transactional emails to sellers and buyers'),

  -- Maintenance
  ('MAINTENANCE_MODE',    'false', 'When true, all non-admin API requests return 503'),
  ('MAINTENANCE_MESSAGE', 'SafeDeliver is currently undergoing scheduled maintenance. Please check back soon.', 'Message shown to users during maintenance')

ON CONFLICT (key) DO NOTHING;
