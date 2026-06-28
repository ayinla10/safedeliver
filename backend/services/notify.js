const db = require('../db');
const { v4: uuid } = require('uuid');
const sms = require('./sms');

/**
 * Log a notification to the DB.
 */
async function log(channel, recipientId, message, transactionId = null, orderRef = null) {
    const status = process.env.AT_API_KEY ? 'SENT' : 'SIMULATED';
    await db.query(
        `INSERT INTO notifications (id, transaction_id, order_ref, channel, recipient_id, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), transactionId, orderRef, channel, recipientId, message, status]
    );
    console.log(`[Notify] ${channel} → ${recipientId}: ${message.substring(0, 80)}...`);
}

/**
 * Send a real SMS via Africa's Talking + log to DB.
 */
async function sendSms(phone, message, transactionId = null, orderRef = null) {
    await sms.send(phone, message);
    await log('SMS', phone, message, transactionId, orderRef);
}

module.exports = {
    sms:   (phone, msg, txId, ref)          => sendSms(phone, msg, txId, ref),
    email: (email, subject, body, txId, ref) => log('EMAIL', email, `${subject}: ${body}`, txId, ref),
    push:  (userId, msg, txId, ref)          => log('PUSH', userId, msg, txId, ref),
};
