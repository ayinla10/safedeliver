# SafeDeliver
## Escrow-Based Social Commerce Platform
### Master Technical & UI/UX Reference
**Academic Research Edition — Version 2.0**

---

| Field | Detail |
|---|---|
| Document Type | Master Technical Reference + UI/UX Specification |
| Version | 2.0 — Academic Research Edition |
| Audience | Engineering Team / Academic Reviewers / Supervisors |
| Stack | React Native + Node.js + PostgreSQL |
| Payment Layer | Fully Internal Simulation Engine (no third-party PSP) |
| SMS | Twilio (real delivery) |
| Email | Resend.com (real delivery) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Currency | Ghana Cedis (GHS) only |
| Prepared by | Prof Tidjani — Tedmark Digital Agency |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Internal Payment Simulation Engine](#3-internal-payment-simulation-engine)
4. [Transaction Lifecycle — The Escrow Engine](#4-transaction-lifecycle--the-escrow-engine)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Notification System](#7-notification-system)
8. [Security Architecture](#8-security-architecture)
9. [Dispute Flow](#9-dispute-flow)
10. [React Native Mobile App — Seller](#10-react-native-mobile-app--seller)
11. [UI/UX Specification](#11-uiux-specification)
12. [Public Website Pages](#12-public-website-pages)
13. [Academic Demo Checklist](#13-academic-demo-checklist)

---

## 1. Executive Summary

SafeDeliver is an escrow-based trust layer designed to protect buyers and sellers in social commerce transactions — primarily in the Ghanaian informal market where trade happens over WhatsApp, Instagram, and Facebook.

The platform holds a buyer's money in a simulated escrow and releases it to the seller only after the buyer confirms delivery. If a dispute arises, an administrator reviews the evidence and makes a final decision.

> **📌 Note:** This version is built for academic research. All payment processing is handled by an internal simulation engine — no third-party payment gateway (e.g. Paystack) is used. This allows full visibility into every aspect of the financial flow during research demonstrations.

### 1.1 Core Problem

Informal sellers in Ghana operate on social media platforms. Buyers typically send Mobile Money upfront and hope the item arrives. There is no protection on either side. SafeDeliver fixes this by holding money in escrow until delivery is confirmed by the buyer or auto-released after 5 days of inactivity.

### 1.2 Who This System Serves

| User Type | How They Interact | Authentication |
|---|---|---|
| Seller | React Native mobile app (iOS + Android) | JWT + OTP login |
| Buyer | Public web tracking page — no account required | Unique token in URL only |
| Admin | Web-based admin dashboard | Secure admin login |

### 1.3 What Changed from v1.0

| Change | Detail |
|---|---|
| Payment Layer | Replaced Paystack with internal simulation engine |
| Mobile App | React Native app added for sellers (iOS + Android) |
| Buyer Experience | Public tracking page with unique token URL — no account needed |
| Notifications | Real SMS (Twilio) + Real Email (Resend.com) + FCM push + simulated WhatsApp |
| Security | Full internal security system — no reliance on third-party PSP security |
| UI Specification | Full UI/UX spec added including light/dark mode |
| Public Pages | Home, About, How It Works, Contact pages fully specified |

---

## 2. System Architecture

### 2.1 High-Level Component Map

The system consists of four primary surfaces connected through a single backend API and a shared PostgreSQL database.

| Component | Description |
|---|---|
| Seller Mobile App | React Native (iOS + Android). Seller registers, creates checkout links, manages orders, marks items as shipped, views transaction history. |
| Buyer Tracking Page | Public web page. No login. Accessible via unique token URL sent by SMS and Email. Buyer confirms delivery or raises a dispute. |
| Admin Web Dashboard | Web-based panel. Admin reviews disputes, approves/rejects KYC, views all transactions, manages escrow releases and refunds. |
| Backend API | Node.js + Express. All business logic, escrow engine, security, notification dispatch, and simulation engine live here. |
| Simulation Engine | Internal module that mimics real payment gateway behaviour — initialisation, confirmation, transfer, refund — all within the system. |
| Notification Hub | Dispatches real SMS (Twilio), real Email (Resend.com), real push (FCM), and logs simulated WhatsApp messages to the database. |
| PostgreSQL Database | Primary data store for all sellers, buyers, transactions, notifications, audit logs, and escrow state. |

### 2.2 Technology Stack

| Layer | Technology | Purpose | Notes |
|---|---|---|---|
| Mobile App | React Native 0.73 | Seller-facing iOS + Android app | Expo managed workflow |
| Web (Tracking Page) | Next.js 14 | Buyer public tracking page | Static generation + API routes |
| Web (Admin) | Next.js 14 | Admin dashboard | Server-side rendering |
| Backend API | Node.js + Express | Core business logic | REST API, escrow engine |
| Database | PostgreSQL 15 | Primary data store | All tables, audit logs |
| Auth | JWT + bcrypt + OTP | Seller and admin auth | Buyers are token-only |
| SMS | Twilio | Real SMS delivery | Free trial credits |
| Email | Resend.com | Real email delivery | Free tier: 3,000/month |
| Push | Firebase FCM | Seller push notifications | Free, unlimited |
| WhatsApp | Internal simulation | Simulated WhatsApp messages | Logged in DB, shown in admin |
| Hosting | AWS / DigitalOcean | Backend + database | Must be publicly reachable |
| File Storage | AWS S3 (private) | KYC documents, dispute photos | Never publicly accessible |

---

## 3. Internal Payment Simulation Engine

Because this is an academic research project, we do not connect to a real payment gateway. Instead, all payment behaviour is simulated by an internal engine we control completely. This gives academic reviewers full visibility into every step of the money flow.

> **📌 Note:** The simulation engine is designed to be architecturally identical to a real PSP integration. If the system were to go live, only the simulation module would need to be swapped out for a real Paystack or Flutterwave integration — no other code would change.

### 3.1 What the Engine Simulates

| Real PSP Action | What Our Simulation Does |
|---|---|
| Payment initialisation | Generates a unique payment reference, creates an INITIATED transaction record |
| Checkout redirect | Shows an internal 'payment page' UI within the app/web where buyer enters fake card or MoMo details |
| Payment webhook | After 2–5 seconds (configurable), the engine fires an internal event to the backend confirming payment |
| Escrow holding | Transaction status moves to PAID — funds are recorded as 'held' in our simulation_ledger table |
| Seller payout (transfer) | Updates simulation_ledger, marks transfer as sent, logs a transfer reference internally |
| Refund | Reverses the ledger entry, marks buyer as refunded, logs refund reference internally |

### 3.2 Simulation Ledger Table

The `simulation_ledger` table acts as our internal 'bank'. Every transaction that holds, releases, or refunds money is recorded here with a before and after balance.

```sql
CREATE TABLE simulation_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  entry_type     VARCHAR(20),  -- HOLD | RELEASE | REFUND | FEE
  amount_ghs     INTEGER,      -- in pesewas
  balance_after  INTEGER,      -- running total in pesewas
  reference      VARCHAR(100) UNIQUE,
  note           TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Simulation Payment Flow

1. Buyer opens checkout link on web — enters name, phone, email, delivery address
2. System creates transaction with status `INITIATED` and generates `order_ref` (e.g. `SD-2024-00412`)
3. Buyer is shown the internal SimPay screen (styled like a real MoMo prompt)
4. Buyer taps 'Confirm Payment' — system waits 3 seconds to mimic network processing
5. Simulation engine fires internal `charge.success` event — transaction moves to `PAID`
6. `simulation_ledger` records a `HOLD` entry for the amount
7. Seller receives FCM push notification and SMS: *"New order received!"*
8. Buyer receives SMS + Email with their unique tracking link

---

## 4. Transaction Lifecycle — The Escrow Engine

Every transaction passes through a finite set of statuses. The backend enforces valid transitions — you cannot jump states. Any invalid transition attempt returns a `400` error.

### 4.1 Status Definitions

| Status | Meaning | Who Triggers It |
|---|---|---|
| INITIATED | Buyer opened checkout page and started the order | System |
| PAID | Simulation engine confirmed payment received | Simulation engine (internal event) |
| SHIPPED | Seller marked the order as dispatched | Seller via mobile app |
| DELIVERED | Buyer confirmed item received on tracking page | Buyer via tracking page |
| CONFIRMED | System verified delivery — payout triggered | System (auto, immediate) |
| DISPUTED | Buyer raised a dispute before confirming delivery | Buyer via tracking page |
| RELEASED | Simulation payout called — seller has been paid | System (auto after CONFIRMED) |
| REFUNDED | Refund issued to buyer — seller gets nothing | Admin decision |
| AUTO_RELEASED | 5-day timer expired with no buyer response | Cron job (hourly) |

### 4.2 Valid Status Transitions

- `INITIATED` → `PAID` (simulation engine internal event after buyer confirms SimPay)
- `PAID` → `SHIPPED` (seller taps 'Mark as Shipped' in mobile app)
- `SHIPPED` → `DELIVERED` (buyer taps 'I Received My Item' on tracking page)
- `SHIPPED` → `DISPUTED` (buyer taps 'Report a Problem' on tracking page)
- `SHIPPED` → `AUTO_RELEASED` (cron job fires after 5 days of no buyer response)
- `DELIVERED` → `CONFIRMED` (auto, immediate — triggers `releaseFundsToSeller`)
- `CONFIRMED` → `RELEASED` (simulation payout logged in ledger)
- `DISPUTED` → `RELEASED` (admin rules in favour of seller)
- `DISPUTED` → `REFUNDED` (admin rules in favour of buyer)
- Any other transition = `400` error from API

### 4.3 Auto-Release Timer (5-Day Rule)

If the buyer does NOT confirm delivery and does NOT raise a dispute within 5 days of the order being marked `SHIPPED`, the system automatically confirms delivery and triggers payout to the seller.

```sql
-- Cron runs every hour:
SELECT * FROM transactions
WHERE status = 'SHIPPED'
  AND shipped_at < NOW() - INTERVAL '5 days'
  AND dispute_raised = false;

-- For each result: set status = AUTO_RELEASED, call releaseFundsToSeller()
```

### 4.4 The Payout Function — Single Source of Truth

All fund releases go through one function only. Called from exactly two places: the delivery confirmation handler, and the admin dispute resolution handler.

```javascript
async function releaseFundsToSeller(transactionId) {
  const tx     = await db.transactions.findById(transactionId);
  const seller = await db.sellers.findById(tx.seller_id);

  // Record payout in simulation ledger
  const ref = 'SIM-PAY-' + Date.now();
  await db.simulation_ledger.insert({
    transaction_id: tx.id,
    entry_type:     'RELEASE',
    amount_ghs:     tx.seller_payout_amount,
    reference:      ref,
    note:           'Payout to seller - Order ' + tx.order_ref
  });

  await db.transactions.update(transactionId, {
    status:           'RELEASED',
    payout_reference: ref,
    released_at:      new Date()
  });

  // Notify seller
  await notify.push(seller.fcm_token, 'Payment Received',
    'GHS ' + tx.seller_payout_amount / 100 + ' sent to your account!');
  await notify.sms(seller.phone,
    'SafeDeliver: Your payment for order ' + tx.order_ref + ' has been released.');
}
```

---

## 5. Database Schema

PostgreSQL 15. Six core tables for the academic research version. Every financial movement is recorded in `simulation_ledger`. Every notification is logged in `notifications`. Every security event is logged in `audit_logs`.

### 5.1 sellers

```sql
CREATE TABLE sellers (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name              VARCHAR(200) NOT NULL,
  email                  VARCHAR(200) UNIQUE NOT NULL,
  phone                  VARCHAR(20)  UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL,
  fcm_token              TEXT,                          -- Firebase push token
  kyc_id_url             TEXT,                          -- S3 private URL
  kyc_selfie_url         TEXT,
  kyc_status             VARCHAR(20) DEFAULT 'PENDING', -- PENDING|APPROVED|REJECTED
  momo_number            VARCHAR(20),
  is_active              BOOLEAN DEFAULT false,
  failed_login_attempts  INTEGER DEFAULT 0,
  locked_until           TIMESTAMP,
  last_login_at          TIMESTAMP,
  created_at             TIMESTAMP DEFAULT NOW()
);
```

### 5.2 checkout_links

```sql
CREATE TABLE checkout_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID REFERENCES sellers(id),
  link_code    VARCHAR(20) UNIQUE NOT NULL,   -- e.g. SDX78291
  product_name VARCHAR(300) NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL,              -- in pesewas
  delivery_fee INTEGER DEFAULT 0,
  image_url    TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

### 5.3 transactions

```sql
CREATE TABLE transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_link_id     UUID REFERENCES checkout_links(id),
  seller_id            UUID REFERENCES sellers(id),
  order_ref            VARCHAR(50) UNIQUE,           -- SD-2024-00412
  buyer_name           VARCHAR(200),
  buyer_phone          VARCHAR(20),
  buyer_email          VARCHAR(200),
  buyer_address        TEXT,
  tracking_token       VARCHAR(100) UNIQUE NOT NULL,  -- used in tracking URL
  total_amount         INTEGER,                       -- pesewas
  platform_fee         INTEGER,
  seller_payout_amount INTEGER,
  status               VARCHAR(20) DEFAULT 'INITIATED',
  dispute_raised       BOOLEAN DEFAULT false,
  dispute_reason       TEXT,
  dispute_evidence_url TEXT,
  admin_decision       VARCHAR(20),
  admin_notes          TEXT,
  sim_payment_ref      VARCHAR(100) UNIQUE,           -- simulation reference
  payout_reference     VARCHAR(100),
  paid_at              TIMESTAMP,
  shipped_at           TIMESTAMP,
  delivered_at         TIMESTAMP,
  released_at          TIMESTAMP,
  created_at           TIMESTAMP DEFAULT NOW()
);
```

### 5.4 simulation_ledger

```sql
CREATE TABLE simulation_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  entry_type     VARCHAR(20),   -- HOLD | RELEASE | REFUND | FEE
  amount_ghs     INTEGER,
  balance_after  INTEGER,
  reference      VARCHAR(100) UNIQUE,
  note           TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

### 5.5 notifications

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id),
  recipient_type  VARCHAR(20),   -- SELLER | BUYER | ADMIN
  recipient_id    VARCHAR(200),  -- seller UUID or buyer phone/email
  channel         VARCHAR(20),   -- SMS | EMAIL | PUSH | WHATSAPP_SIM
  status          VARCHAR(20),   -- SENT | FAILED | SIMULATED
  message         TEXT,
  external_ref    TEXT,          -- Twilio SID, Resend ID, FCM message ID
  sent_at         TIMESTAMP DEFAULT NOW()
);
```

### 5.6 audit_logs

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type  VARCHAR(20),    -- SELLER | BUYER | ADMIN | SYSTEM
  actor_id    VARCHAR(200),
  action      VARCHAR(100),   -- LOGIN | STATUS_CHANGE | DISPUTE_RAISED | etc.
  entity_type VARCHAR(50),
  entity_id   UUID,
  ip_address  VARCHAR(50),
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API Endpoints

**Base URL:** `/api/v1`  
**Authenticated routes require:** `Authorization: Bearer <jwt>`

### 6.1 Authentication (Sellers)

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Seller registers: name, email, phone, password |
| POST | `/auth/verify-otp` | Verify phone OTP sent on registration |
| POST | `/auth/login` | Returns JWT on valid credentials + logs audit event |
| POST | `/auth/refresh` | Refresh JWT using refresh token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Send password reset OTP to phone |
| POST | `/auth/reset-password` | Reset password with OTP |

### 6.2 Checkout Links (Seller — Authenticated)

| Method | Route | Description |
|---|---|---|
| POST | `/checkout-links` | Create a new checkout link |
| GET | `/checkout-links` | List all seller's checkout links |
| GET | `/checkout-links/:linkCode` | Get single link details |
| PATCH | `/checkout-links/:linkCode` | Enable or disable a link |
| DELETE | `/checkout-links/:linkCode` | Soft delete a link |

### 6.3 Transactions & Escrow

| Method | Route | Description |
|---|---|---|
| GET | `/pay/:linkCode` | Public — load product info for checkout page |
| POST | `/transactions` | Public — buyer submits order, initialise SimPay |
| POST | `/transactions/sim-confirm` | Simulation engine — confirm payment after delay |
| GET | `/track/:token` | Public — buyer loads tracking page (token in URL) |
| PATCH | `/transactions/:id/ship` | Seller — mark order as shipped |
| PATCH | `/transactions/:id/confirm-delivery` | Buyer (token auth) — confirm delivery, triggers payout |
| POST | `/transactions/:id/dispute` | Buyer (token auth) — raise dispute with reason + photo |
| GET | `/transactions` | Seller — list own transactions with filters |
| GET | `/transactions/:id` | Seller — get single transaction detail |

### 6.4 Admin

| Method | Route | Description |
|---|---|---|
| GET | `/admin/disputes` | List all open disputes |
| PATCH | `/admin/disputes/:id/resolve` | Resolve: `{ decision: 'REFUND' \| 'RELEASE', notes }` |
| GET | `/admin/transactions` | All transactions — filterable by status |
| GET | `/admin/ledger` | View full simulation ledger entries |
| GET | `/admin/notifications` | View all notification logs including simulated WhatsApp |
| PATCH | `/admin/sellers/:id/kyc` | Approve or reject seller KYC |
| GET | `/admin/sellers` | List all sellers and their KYC status |
| GET | `/admin/audit-logs` | View full audit trail |

---

## 7. Notification System

Every key event in the transaction journey triggers one or more notifications. The system uses four channels: real SMS via Twilio, real Email via Resend.com, real push notifications via Firebase FCM for sellers, and simulated WhatsApp messages logged in the database and visible in the admin panel.

### 7.1 Notification Events by Role

| Event | Buyer Gets | Seller Gets | Admin Gets |
|---|---|---|---|
| Order PAID | SMS + Email with tracking link | FCM Push + SMS: New order! | — |
| Order SHIPPED | SMS + Email: Your order is on the way | FCM Push: Shipment recorded | — |
| Order DELIVERED | SMS + Email: Delivery confirmed | FCM Push + SMS: Payment releasing | — |
| Order AUTO_RELEASED | SMS + Email: Order closed after 5 days | FCM Push + SMS: Payment released | — |
| Dispute RAISED | SMS + Email: Dispute received | FCM Push + SMS: Dispute raised against your order | Email: New dispute needs review |
| Dispute RESOLVED (RELEASE) | SMS + Email: Dispute resolved — seller paid | FCM Push + SMS: Dispute resolved in your favour | — |
| Dispute RESOLVED (REFUND) | SMS + Email: Refund initiated | FCM Push + SMS: Dispute resolved — refund issued to buyer | — |
| KYC Approved | — | FCM Push + SMS: KYC approved — you can now sell! | — |
| KYC Rejected | — | FCM Push + SMS: KYC rejected — see admin notes | — |

### 7.2 Simulated WhatsApp

Every notification event also creates a simulated WhatsApp message record in the `notifications` table with `channel = 'WHATSAPP_SIM'` and `status = 'SIMULATED'`. The admin dashboard displays these in a WhatsApp-styled message thread view, demonstrating what the WhatsApp channel would look like in production.

> **📌 Note:** Real WhatsApp Business API integration requires business verification from Meta. For academic demonstration, the simulation is architecturally identical — only the final dispatch call is mocked.

### 7.3 Notification Dispatch Module

```javascript
// notify.js — single dispatch module
const notify = {
  sms: (phone, message) =>
    twilioClient.messages.create({ to: phone, from: TWILIO_NUMBER, body: message }),

  email: (to, subject, html) =>
    resend.emails.send({ from: 'SafeDeliver <no-reply@safedeliver.co>', to, subject, html }),

  push: (fcmToken, title, body) =>
    firebase.messaging().send({ token: fcmToken, notification: { title, body } }),

  whatsapp_sim: async (phone, message, txId) => {
    await db.notifications.insert({
      channel: 'WHATSAPP_SIM',
      status: 'SIMULATED',
      recipient_id: phone,
      message,
      transaction_id: txId
    });
  },

  log: async (record) => { await db.notifications.insert(record); }
};
```

---

## 8. Security Architecture

Because we have no third-party payment gateway providing its own security layer, we must implement a comprehensive internal security system. Every aspect of money handling, authentication, and data protection is our responsibility.

### 8.1 Authentication Security

| Control | Implementation |
|---|---|
| Password hashing | bcrypt with cost factor 12 minimum. Never store plaintext passwords. |
| JWT tokens | Access token: 15-minute expiry. Refresh token: 7-day expiry, stored httpOnly cookie. |
| OTP for phone verification | 6-digit OTP, expires in 10 minutes, maximum 3 attempts before lockout. |
| Account lockout | After 5 failed login attempts: account locked for 30 minutes. Logged in audit_logs. |
| Session invalidation | Refresh tokens stored in DB. Logout deletes the token — prevents reuse. |
| Admin auth | Separate admin credentials, no shared auth with sellers, additional 2FA required. |

### 8.2 Buyer Token Security

Buyers do not log in. Their identity is their order tracking token. This token must be treated as a secret.

| Control | Implementation |
|---|---|
| Token generation | `crypto.randomBytes(32).toString('hex')` — 256-bit random token. Unique per transaction. |
| Token storage | Stored as a hash in the database (SHA-256). Raw token only sent to buyer once via SMS + Email. |
| Token validation | On every buyer action (confirm delivery, raise dispute), the raw token is hashed and compared. |
| Rate limiting | Tracking page: 20 requests/minute per IP. Dispute endpoint: 5 requests/minute per IP. |
| Action replay prevention | Once delivery is confirmed or dispute raised, the endpoint rejects further requests for that token. |

### 8.3 Financial Security (Simulation Engine)

| Control | Implementation |
|---|---|
| Ledger immutability | `simulation_ledger` entries are INSERT-only. No UPDATE or DELETE allowed on ledger rows. |
| Double-release prevention | `releaseFundsToSeller()` checks `status === 'CONFIRMED'` before proceeding. Idempotent. |
| Fee calculation integrity | Platform fee calculated server-side only. Client-submitted amounts are never trusted. |
| Transaction state machine | Backend enforces valid status transitions. Invalid transitions return 400 immediately. |
| Atomic operations | All status changes + ledger entries happen inside a single PostgreSQL transaction (BEGIN/COMMIT). |
| Audit trail | Every state change is recorded in `audit_logs` with actor, timestamp, IP, and old/new values. |

### 8.4 API & Infrastructure Security

| Control | Implementation |
|---|---|
| HTTPS | Enforced on all routes. HTTP requests are redirected to HTTPS. No exceptions. |
| Rate limiting | `express-rate-limit`: 100 req/min general, 20 req/min buyer endpoints, 5 req/min auth endpoints. |
| SQL injection prevention | Parameterised queries everywhere via `pg` library. Zero string concatenation in SQL. |
| Input validation | Joi or Zod schemas on every request body. All inputs sanitised before DB write. |
| CORS | Strict origin whitelist. Only app and tracking page domains are allowed. |
| Helmet.js | Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options. |
| Environment secrets | All keys in `.env` — never in source code. `.env` never committed to git. |
| S3 KYC storage | KYC images stored in private S3 bucket. Accessed via signed URLs (15 min expiry) only. |
| File upload validation | MIME type + file size validation on dispute photo uploads. Max 5MB, images only. |

### 8.5 Non-Negotiables Before Demo

- HTTPS on every route — no exceptions
- Account lockout after 5 failed logins — tested
- Ledger entries are insert-only — no update/delete path exists in code
- `releaseFundsToSeller()` is idempotent — safe to call twice
- All buyer actions require valid tracking token — no bypass
- Audit log captures every status change, every login, every admin action
- Rate limiting active on all public-facing endpoints
- No secrets in source code — verified before demo

---

## 9. Dispute Flow

A dispute freezes the auto-release timer and routes the transaction to admin review. Money does not move until the admin makes a final decision.

### 9.1 How a Buyer Raises a Dispute

1. Buyer opens their tracking page via the unique URL sent in their SMS and Email
2. Buyer taps 'Report a Problem' — available only while status is `SHIPPED`
3. Buyer selects a reason: **Item not received** | **Wrong item** | **Item damaged** | **Other**
4. Buyer optionally uploads a photo of evidence (max 5MB, images only)
5. Transaction status changes to `DISPUTED`, auto-release timer is cancelled
6. Seller receives FCM push + SMS: *"A dispute has been raised on your order"*
7. Admin receives Email: *"A new dispute requires review"*

### 9.2 Admin Resolution Process

Admin reviews the dispute reason, buyer evidence photo, and seller's shipping record. Admin must write a note explaining the decision.

| Admin Decision | What Happens |
|---|---|
| RELEASE — rules in favour of seller | `releaseFundsToSeller()` is called. Status → `RELEASED`. Both parties notified by SMS + email. |
| REFUND — rules in favour of buyer | Simulation refund logged in ledger. Status → `REFUNDED`. Both parties notified by SMS + email. |

### 9.3 What Is NOT Built for Academic MVP

- No peer-to-peer messaging between buyer and seller
- No automated fraud detection algorithms
- No appeals process — admin decision is final
- Admin reviews evidence manually and makes a judgement call — sufficient for academic demonstration

---

## 10. React Native Mobile App — Seller

The seller-facing mobile app is built in React Native using Expo managed workflow, supporting both iOS and Android. The app is the seller's primary interface for managing their entire SafeDeliver business.

### 10.1 App Screens

| Screen | Description |
|---|---|
| Onboarding | Intro slides explaining SafeDeliver, then Register or Login CTA |
| Register | Name, phone, email, password. OTP verification step. |
| Login | Phone + password. JWT stored securely in SecureStore (Expo). |
| Dashboard (Home) | Summary: total sales, active orders, pending shipments, escrow balance |
| Checkout Links | List of all links. Create new link FAB button. Toggle active/inactive. |
| Create Link | Product name, description, price, delivery fee, image upload |
| Orders | Tab-filtered list: All \| Pending \| Shipped \| Completed \| Disputed |
| Order Detail | Full order info, buyer details, status timeline, 'Mark as Shipped' action |
| KYC Upload | Upload ID card photo + selfie. View KYC status. |
| Profile | Edit name, phone, MoMo number. Change password. Logout. |
| Notifications | In-app notification history (all push events stored locally) |

### 10.2 Key Technical Requirements

| Requirement | Implementation |
|---|---|
| Auth token storage | Expo SecureStore — never AsyncStorage for JWT |
| Push notifications | expo-notifications + Firebase FCM. FCM token saved to DB on login. |
| Image upload (KYC/product) | expo-image-picker + multipart form upload to backend → S3 |
| Offline handling | Show cached data with 'You are offline' banner. Disable write actions. |
| Deep links | Handle push notification taps — navigate directly to relevant order screen |
| Biometric lock | Optional: expo-local-authentication for app lock after background |

---

## 11. UI/UX Specification

This section defines the design system, colour palette, typography, and component behaviour for all surfaces: the React Native mobile app, the public tracking page, the admin dashboard, and the public website.

### 11.1 Design Philosophy

SafeDeliver's visual identity communicates trust, safety, and simplicity. The colour palette is built around deep teal (representing security and calm) and warm gold (representing value and transactions). The UI is clean and spacious — designed for low-literacy users as much as tech-savvy ones.

### 11.2 Colour Palette

| Token | Hex Value | Usage |
|---|---|---|
| `--brand` | `#1A6B5A` | Primary brand colour — headers, key CTAs, nav bar |
| `--accent` | `#27AE8F` | Secondary teal — progress bars, highlights, links |
| `--gold` | `#D4A017` | Warm gold — transaction amounts, premium actions |
| `--dark` | `#1C2B36` | Near-black — body text, dark backgrounds |
| `--mid` | `#4A6572` | Slate grey — secondary text, labels, captions |
| `--light` | `#ECF5F2` | Pale mint — page backgrounds, card backgrounds |
| `--surface` | `#FFFFFF` | White — card surfaces, input backgrounds |
| `--danger` | `#C0392B` | Red — errors, disputes, warnings |
| `--success` | `#27AE60` | Green — confirmed, released, approved |
| `--warn` | `#E67E22` | Orange — pending, in-progress states |

### 11.3 Typography

| Element | Specification |
|---|---|
| Primary font | Inter (Google Fonts) — clean, readable, professional |
| Mono font | JetBrains Mono — for order references and codes only |
| H1 / Page titles | Inter Bold, 32px, colour: `--brand` |
| H2 / Section headings | Inter SemiBold, 24px, colour: `--dark` |
| H3 / Card headings | Inter SemiBold, 18px, colour: `--dark` |
| Body text | Inter Regular, 15px, colour: `--dark`, line-height: 1.6 |
| Labels / Captions | Inter Regular, 12px, colour: `--mid` |
| Amount displays | Inter Bold, 28px, colour: `--gold` |
| Order reference | JetBrains Mono, 14px, colour: `--mid` |

### 11.4 Light / Dark Mode

Both the mobile app and web surfaces support light and dark modes. The system follows the device's system preference by default, with a manual toggle available in app settings and the website header.

| Token | Light Mode | Dark Mode |
|---|---|---|
| Background | `#F7FAF9` | `#0F1F1A` |
| Surface (cards) | `#FFFFFF` | `#1A2F28` |
| Primary text | `#1C2B36` | `#ECF5F2` |
| Secondary text | `#4A6572` | `#8AAFA5` |
| Border | `#D9E8E3` | `#2C4A41` |

### 11.5 Status Badge Colours

| Status | Background | Text Colour |
|---|---|---|
| INITIATED | `#EAF4FB` | `#1A6B9A` |
| PAID | `#EAF4FB` | `#1A6B9A` |
| SHIPPED | `#FEF9EC` | `#7D5A00` |
| DELIVERED | `#EAF7EE` | `#1A6B3A` |
| CONFIRMED | `#EAF7EE` | `#1A6B3A` |
| RELEASED | `#EAF7EE` | `#1A6B3A` |
| DISPUTED | `#FDECEC` | `#7D1A1A` |
| REFUNDED | `#FDECEC` | `#7D1A1A` |
| AUTO_RELEASED | `#F5EAF7` | `#5A1A7D` |

---

## 12. Public Website Pages

The SafeDeliver website serves three purposes: explain the product to potential sellers, build trust with buyers who receive checkout links, and provide a channel for enquiries. All pages support light and dark mode.

### 12.1 Home Page

**Hero Section**
- Full-width hero with headline: *"Send Money. Get Your Item. Or Get It Back."*
- Subheadline: *"SafeDeliver protects every social commerce transaction in Ghana. Your money is safe until your item arrives."*
- Two CTAs: **Start Selling Free** (primary, `--brand`) and **How It Works** (outline, `--accent`)
- Background: abstract teal gradient with a subtle pattern of padlocks or shields

**Trust Stats Bar**
- Three animated stats: Transactions Protected | Sellers Using SafeDeliver | Average Release Time
- Numbers animate up on scroll-enter

**How It Works (Summary — 3 steps)**
- Step 1: Seller creates a checkout link in 60 seconds
- Step 2: Buyer pays through the secure link — money is held safely
- Step 3: Buyer confirms delivery — seller gets paid instantly
- Each step has an icon, a headline, and 2 lines of body copy

**Why SafeDeliver**
- 4 benefit cards: Buyer Protection | Instant Payout | Dispute Resolution | No Marketplace Fees
- Each card has an icon, title, and 2-line description

**Testimonials**
- 3 testimonial cards with avatar, name, city, and quote
- Focused on Ghanaian sellers and buyers — real language, real scenarios

**Final CTA Banner**
- Brand-coloured full-width section: *"Ready to sell with confidence?"* + **Create Your Free Account** button

---

### 12.2 About Page

**Mission Statement**
- *"We built SafeDeliver because we got tired of watching people lose money on WhatsApp deals that never arrived."*
- Short paragraph on the informal commerce problem in Ghana and the trust gap SafeDeliver fills

**The Problem We Solve**
- Side-by-side comparison: Without SafeDeliver (buyer pays → hopes for the best) vs With SafeDeliver (buyer pays → money held → item confirmed → seller paid)

**Our Values**
- Trust | Transparency | Simplicity | Protection
- Each value has an icon and a 2-sentence explanation

**The Team**
- Team member cards: photo, name, role, one-liner
- For academic version: can include researcher/developer names

**Academic Research Note**
- Clearly states: *"This version of SafeDeliver is an academic research prototype. The payment system is fully simulated for research demonstration purposes."*

---

### 12.3 How It Works Page

**Detailed Step-by-Step Flow**

1. Seller registers and completes KYC — takes less than 5 minutes
2. Seller creates a checkout link: product name, price, delivery fee, and product photo
3. Seller shares the link on WhatsApp, Instagram, Facebook, or anywhere
4. Buyer opens the link, fills their name, phone, email, and address — then pays
5. Money is held in escrow — seller is notified immediately
6. Seller ships the item and marks it as shipped in the app
7. Buyer receives SMS + email with a link to confirm delivery
8. Buyer confirms delivery — seller receives payment immediately
9. If there is a problem, buyer reports it — our team reviews and resolves within 24 hours

**Dispute Resolution Explained**
- What happens when a buyer raises a dispute
- What evidence the buyer needs to provide
- How long admin review takes (24 hours for academic version)
- What both outcomes look like (RELEASE or REFUND)

**FAQ Section**

| Question | Answer |
|---|---|
| Is my money safe while it is held? | Yes, it cannot be released until you confirm or a dispute is resolved. |
| What if I never confirm delivery? | After 5 days, the system automatically releases payment to the seller. |
| How does the seller get paid? | Directly to their registered Mobile Money number. |
| Do I need an account as a buyer? | No. You only need the checkout link. |
| How long does dispute resolution take? | We aim to resolve within 24 hours of evidence submission. |

---

### 12.4 Contact Page

**Contact Details**
- Email: hello@safedeliver.co
- Phone / WhatsApp: displayed clearly
- Office location (if applicable)
- Operating hours

**Enquiry Form Fields**
- Full Name *(required)*
- Email Address *(required)*
- Phone Number *(optional)*
- I am a: Seller | Buyer | Researcher | Press | Other *(radio group)*
- Subject *(required)*
- Message *(required, min 20 characters)*
- Submit button: **Send Message** — sends to backend, stored in DB, email forwarded to admin

> **📌 Note:** Enquiry form submissions are stored in the database and trigger an email notification to the admin via Resend.com. No third-party form service is used.

---

## 13. Academic Demo Checklist

The system is ready for academic demonstration when every item below passes end-to-end in the simulation environment.

### 13.1 Core Flow

- [ ] Seller can register, verify phone via OTP, and log in on the React Native app
- [ ] Seller can create a checkout link with product name, price, delivery fee, and image
- [ ] Buyer can open the checkout link on web and see full product details
- [ ] Buyer can complete the SimPay payment flow — order moves to PAID
- [ ] Simulation ledger records a HOLD entry for the correct amount
- [ ] Seller receives FCM push notification and real SMS for each new order (Twilio)
- [ ] Buyer receives real SMS and Email with their unique tracking link (Twilio + Resend)
- [ ] Seller can mark an order as SHIPPED in the mobile app
- [ ] Buyer can open tracking page and see live order status timeline
- [ ] Buyer can confirm delivery on tracking page — `releaseFundsToSeller()` is called
- [ ] Simulation ledger records a RELEASE entry — status moves to RELEASED
- [ ] Seller receives FCM push + SMS confirming payment release
- [ ] Auto-release cron fires correctly after 5 days of no buyer response

### 13.2 Dispute Flow

- [ ] Buyer can raise a dispute with a reason and optional photo upload
- [ ] Dispute cancels auto-release timer immediately
- [ ] Admin receives email notification of new dispute
- [ ] Admin dashboard shows dispute with buyer evidence and order details
- [ ] Admin can resolve with RELEASE — seller paid, both parties notified
- [ ] Admin can resolve with REFUND — ledger records REFUND entry, both parties notified

### 13.3 KYC & Security

- [ ] Seller KYC upload works for ID card and selfie
- [ ] Admin can approve or reject KYC with a note
- [ ] Account lockout triggers after 5 failed logins
- [ ] Audit log records every status change and admin action
- [ ] Rate limiting is active on all public-facing endpoints
- [ ] Buyer token hashing works — raw token never stored in DB

### 13.4 UI & Notifications

- [ ] Mobile app renders correctly on both iOS and Android
- [ ] Light and dark mode works on app and web
- [ ] All four notification channels work (SMS, Email, FCM, WhatsApp_sim)
- [ ] Admin panel shows simulated WhatsApp notification log
- [ ] Simulation ledger is viewable in admin panel with all entry types
- [ ] Public website pages are live: Home, About, How It Works, Contact
- [ ] Contact enquiry form submits and admin receives notification
- [ ] 10 complete test transactions demonstrated end-to-end

### 13.5 Excluded from Academic MVP — Do Not Build Yet

- Native mobile app for buyers (buyers use the public tracking web page)
- Real Mobile Money disbursement to seller accounts
- Seller ratings or review system
- Inventory management
- Delivery partner API integration
- AI fraud detection
- USSD channel
- Full marketplace with product listings, search, or cart functionality
- Blockchain or smart contract escrow

---

*SafeDeliver | Master Technical Reference v2.0 | Academic Research Edition*  
*Prepared by Prof Tidjani — Tedmark Digital Agency | Internal Use Only*
