/**
 * SafeDeliver — Real WhatsApp notifications via Twilio Sandbox
 *
 * Sandbox setup:
 *   Number:  +1 415 523 8886
 *   Join code: "join that-rubbed"
 *   Recipients must send "join that-rubbed" to the number before receiving messages.
 *
 * Env vars required on Render:
 *   TWILIO_ACCOUNT_SID   — get from Twilio console (Account Info panel)
 *   TWILIO_AUTH_TOKEN    — get from Twilio console (keep secret)
 *   TWILIO_WHATSAPP_FROM — whatsapp:+14155238886
 */

const twilio = require('twilio');

const accountSid  = process.env.TWILIO_ACCOUNT_SID;
const authToken   = process.env.TWILIO_AUTH_TOKEN;
const fromNumber  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

let client = null;

function getClient() {
    if (!accountSid || !authToken) return null;
    if (!client) client = twilio(accountSid, authToken);
    return client;
}

/**
 * Normalise a phone number to international WhatsApp format.
 * Assumes Ghana (+233) if number starts with 0.
 * Already-international numbers (+XXX…) are passed through.
 */
function formatPhone(phone) {
    if (!phone) return null;
    // Strip spaces/dashes
    const clean = phone.replace(/[\s\-().]/g, '');
    // Already has country code
    if (clean.startsWith('+')) return `whatsapp:${clean}`;
    // Local Ghana number (0XXXXXXXXX → +233XXXXXXXXX)
    if (clean.startsWith('0')) return `whatsapp:+233${clean.slice(1)}`;
    // Bare digits assumed Ghana
    return `whatsapp:+233${clean}`;
}

/**
 * Send a WhatsApp message.
 * Falls back to a console log (no-op) if Twilio is not configured.
 *
 * @param {string} phone   - recipient phone (local or international)
 * @param {string} message - plain-text message body
 * @returns {Promise<string|null>} - Twilio message SID or null
 */
async function send(phone, message) {
    const to = formatPhone(phone);
    if (!to) {
        console.warn('[WhatsApp] No phone provided, skipping.');
        return null;
    }

    const cli = getClient();
    if (!cli) {
        // Twilio not configured — log and move on (don't crash the flow)
        console.log(`[WhatsApp SIMULATED] → ${to}\n${message}`);
        return null;
    }

    try {
        const msg = await cli.messages.create({
            from: fromNumber,
            to,
            body: message,
        });
        console.log(`[WhatsApp] Sent to ${to} — SID: ${msg.sid}`);
        return msg.sid;
    } catch (err) {
        // Log but never throw — a failed WhatsApp message should not break the order flow
        console.error(`[WhatsApp] Failed to send to ${to}:`, err.message);
        return null;
    }
}

module.exports = { send, formatPhone };
