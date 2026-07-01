const { Resend } = require('resend');

// Resend instance — created lazily so hot-reloads pick up the env var
function getResend() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

// FROM address:
//   • Set EMAIL_FROM on Render once you have a verified domain, e.g. "SafeDeliver <hello@yourdomain.com>"
//   • Until then, onboarding@resend.dev works on Resend's free tier
//     (can only send TO the email registered on your Resend account)
const FROM = process.env.EMAIL_FROM || 'SafeDeliver <onboarding@resend.dev>';

/**
 * Send a transactional email via Resend.
 * Returns { id } on success, throws on failure.
 * Silently logs and returns null if RESEND_API_KEY is not set (dev mode).
 */
async function send(to, subject, html) {
    const resend = getResend();
    if (!resend) {
        console.log(`[Email] SIMULATED (no RESEND_API_KEY) → ${to}: ${subject}`);
        return null;
    }
    console.log(`[Email] Sending via Resend → ${to}: ${subject} (from: ${FROM})`);
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
        console.error('[Email] Resend error:', error);
        throw new Error(error.message);
    }
    console.log(`[Email] Sent — id: ${data?.id}`);
    return data;
}

// ── Email Templates ────────────────────────────────────────────────────────

function baseTemplate(content) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f4f5; color:#18181b; }
  .wrap { max-width:580px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
  .header { background:#FF6B00; padding:28px 32px; text-align:center; }
  .header h1 { margin:0; color:#fff; font-size:1.4rem; font-weight:800; letter-spacing:-0.5px; }
  .body { padding:32px; }
  .body p { margin:0 0 16px; line-height:1.6; font-size:0.95rem; color:#3f3f46; }
  .btn { display:inline-block; background:#FF6B00; color:#fff!important; text-decoration:none; padding:13px 28px; border-radius:8px; font-weight:700; font-size:0.95rem; margin:8px 0 16px; }
  .code { background:#f4f4f5; border:1px solid #e4e4e7; border-radius:8px; padding:16px 24px; text-align:center; font-size:2rem; font-weight:800; letter-spacing:0.3em; font-family:monospace; color:#18181b; margin:16px 0; }
  .footer { padding:20px 32px; border-top:1px solid #f4f4f5; font-size:0.75rem; color:#a1a1aa; text-align:center; line-height:1.6; }
  .info { background:#f4f4f5; border-radius:8px; padding:14px 18px; margin:16px 0; font-size:0.88rem; color:#52525b; }
  .info b { color:#18181b; }
  .warn { background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:12px 16px; font-size:0.85rem; color:#9a3412; margin:16px 0; }
</style></head><body>
<div class="wrap">
  <div class="header"><h1>🛡️ SafeDeliver</h1></div>
  <div class="body">${content}</div>
  <div class="footer">
    SafeDeliver — Ghana's Trusted Escrow Platform<br>
    This is an automated message. Do not reply to this email.<br>
    &copy; ${new Date().getFullYear()} SafeDeliver
  </div>
</div>
</body></html>`;
}

module.exports = {
    /**
     * Password reset email with a clickable link.
     */
    async passwordReset(to, name, resetUrl) {
        const html = baseTemplate(`
            <p>Hi <b>${name}</b>,</p>
            <p>We received a request to reset your SafeDeliver password. Click the button below to set a new password:</p>
            <div style="text-align:center; margin:24px 0;">
                <a href="${resetUrl}" class="btn">Reset My Password</a>
            </div>
            <p>Or copy this link into your browser:</p>
            <div class="info" style="word-break:break-all;">${resetUrl}</div>
            <div class="warn">⏱ This link expires in <b>1 hour</b>. If you didn't request a password reset, you can safely ignore this email.</div>
        `);
        return send(to, 'Reset your SafeDeliver password', html);
    },

    /**
     * Payment confirmed — sent to buyer when escrow is funded.
     */
    async paymentConfirmed(to, { buyerName, orderRef, amount, productName, trackUrl }) {
        const html = baseTemplate(`
            <p>Hi <b>${buyerName}</b>,</p>
            <p>Your payment has been received and is safely held in escrow. The seller will ship your item shortly.</p>
            <div class="info">
                <b>Order:</b> ${orderRef}<br>
                <b>Item:</b> ${productName}<br>
                <b>Amount held:</b> GHS ${(amount / 100).toFixed(2)}<br>
                <b>Status:</b> Waiting for seller to ship
            </div>
            <p>Your money is protected until you confirm delivery. Track your order anytime:</p>
            <div style="text-align:center; margin:24px 0;">
                <a href="${trackUrl}" class="btn">Track My Order</a>
            </div>
        `);
        return send(to, `Payment confirmed — Order ${orderRef}`, html);
    },

    /**
     * Order shipped — sent to buyer when seller marks as shipped.
     */
    async orderShipped(to, { buyerName, orderRef, productName, trackUrl }) {
        const html = baseTemplate(`
            <p>Hi <b>${buyerName}</b>,</p>
            <p>Your order has been shipped! The seller is on the way to deliver your item.</p>
            <div class="info">
                <b>Order:</b> ${orderRef}<br>
                <b>Item:</b> ${productName}
            </div>
            <p>Once you receive your item, please confirm delivery so the seller can be paid.</p>
            <div style="text-align:center; margin:24px 0;">
                <a href="${trackUrl}" class="btn">Confirm Delivery</a>
            </div>
            <div class="warn">⏱ If you don't confirm delivery, funds will be <b>automatically released after 5 days</b>.</div>
        `);
        return send(to, `Your order ${orderRef} has been shipped`, html);
    },

    /**
     * Dispute raised — sent to admin.
     */
    async disputeRaised(to, { orderRef, buyerName, sellerName, reason, adminUrl }) {
        const html = baseTemplate(`
            <p>A dispute has been raised and requires your attention.</p>
            <div class="info">
                <b>Order:</b> ${orderRef}<br>
                <b>Buyer:</b> ${buyerName}<br>
                <b>Seller:</b> ${sellerName}<br>
                <b>Reason:</b> ${reason || 'Not specified'}
            </div>
            <div style="text-align:center; margin:24px 0;">
                <a href="${adminUrl}" class="btn">Review Dispute</a>
            </div>
        `);
        return send(to, `⚠️ Dispute raised — Order ${orderRef}`, html);
    },

    /**
     * Funds released — sent to seller when escrow is released.
     */
    async fundsReleased(to, { sellerName, orderRef, amount, dashboardUrl }) {
        const html = baseTemplate(`
            <p>Hi <b>${sellerName}</b>,</p>
            <p>Great news! Escrow funds for order <b>${orderRef}</b> have been released to your MoMo account.</p>
            <div class="info">
                <b>Amount released:</b> GHS ${(amount / 100).toFixed(2)}<br>
                <b>Order:</b> ${orderRef}
            </div>
            <p>The transfer will arrive within a few minutes.</p>
            <div style="text-align:center; margin:24px 0;">
                <a href="${dashboardUrl}" class="btn">View Dashboard</a>
            </div>
        `);
        return send(to, `💰 Funds released — Order ${orderRef}`, html);
    },

    /** Raw send — for one-off emails */
    send,
};
