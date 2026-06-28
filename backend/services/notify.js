const db = require('../db');
const { v4: uuid } = require('uuid');
const wa = require('./whatsapp');

async function send(channel, recipientId, message, transactionId = null, orderRef = null) {
    const status = process.env.NODE_ENV === 'production' ? 'SENT' : 'SIMULATED';
    await db.query(
        `INSERT INTO notifications (id, transaction_id, order_ref, channel, recipient_id, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), transactionId, orderRef, channel, recipientId, message, status]
    );
    console.log(`[Notify] ${channel} → ${recipientId}: ${message.substring(0, 80)}...`);
}

/**
 * Send a real WhatsApp message via Twilio AND log it to the notifications table.
 */
async function whatsapp(phone, message, transactionId = null, orderRef = null) {
    // Fire the real Twilio message (non-blocking failure)
    await wa.send(phone, message);

    // Always log to DB so admin can see notification history
    const status = process.env.TWILIO_AUTH_TOKEN ? 'SENT' : 'SIMULATED';
    await db.query(
        `INSERT INTO notifications (id, transaction_id, order_ref, channel, recipient_id, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), transactionId, orderRef, 'WHATSAPP', phone, message, status]
    );
    console.log(`[WhatsApp] → ${phone}: ${message.substring(0, 80)}...`);
}

module.exports = {
    sms:      (phone, msg, txId, ref)          => send('SMS', phone, msg, txId, ref),
    email:    (email, subject, body, txId, ref) => send('EMAIL', email, `${subject}: ${body}`, txId, ref),
    push:     (userId, msg, txId, ref)          => send('PUSH', userId, msg, txId, ref),
    whatsapp,
};
