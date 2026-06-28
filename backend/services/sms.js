/**
 * SafeDeliver — Real SMS via Africa's Talking
 *
 * Env vars (add to Render):
 *   AT_USERNAME  — your Africa's Talking username (or "sandbox" for testing)
 *   AT_API_KEY   — your Africa's Talking API key
 *   AT_SENDER_ID — optional sender name e.g. "SafeDlvr" (leave blank for sandbox)
 */

let client = null;

function getClient() {
    const username = process.env.AT_USERNAME;
    const apiKey   = process.env.AT_API_KEY;
    if (!username || !apiKey) return null;
    if (!client) {
        const AT = require('africastalking')({ username, apiKey });
        client = AT.SMS;
    }
    return client;
}

/**
 * Normalise a phone number to international format.
 * Assumes Ghana (+233) if number starts with 0.
 */
function formatPhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/[\s\-().]/g, '');
    if (clean.startsWith('+')) return clean;
    if (clean.startsWith('0')) return `+233${clean.slice(1)}`;
    return `+233${clean}`;
}

/**
 * Send a real SMS via Africa's Talking.
 * Falls back to console log if not configured.
 *
 * @param {string} phone   - recipient phone number
 * @param {string} message - SMS body
 * @returns {Promise<void>}
 */
async function send(phone, message) {
    const to = formatPhone(phone);
    if (!to) {
        console.warn('[SMS] No phone provided, skipping.');
        return;
    }

    const sms = getClient();
    if (!sms) {
        console.log(`[SMS SIMULATED] → ${to}\n${message}`);
        return;
    }

    try {
        const options = { to: [to], message };
        // Only set sender ID in production (sandbox ignores it)
        if (process.env.AT_SENDER_ID && process.env.AT_USERNAME !== 'sandbox') {
            options.from = process.env.AT_SENDER_ID;
        }
        const result = await sms.send(options);
        const recipient = result.SMSMessageData?.Recipients?.[0];
        console.log(`[SMS] Sent to ${to} — status: ${recipient?.status}, cost: ${recipient?.cost}`);
    } catch (err) {
        console.error(`[SMS] Failed to send to ${to}:`, err.message);
    }
}

module.exports = { send, formatPhone };
