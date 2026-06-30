const db = require('../db');
const { v4: uuid } = require('uuid');
const sms = require('./sms');
const appSettings = require('./settings');

/**
 * Log a notification to the DB.
 */
async function log(channel, recipientId, message, transactionId = null, orderRef = null, status = null) {
    const resolvedStatus = status || (process.env.AT_API_KEY ? 'SENT' : 'SIMULATED');
    await db.query(
        `INSERT INTO notifications (id, transaction_id, order_ref, channel, recipient_id, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), transactionId, orderRef, channel, recipientId, message, resolvedStatus]
    );
    console.log(`[Notify] ${channel} → ${recipientId}: ${message.substring(0, 80)}...`);
}

/**
 * Send a real SMS via Africa's Talking + log to DB.
 * Skipped (logged as SIMULATED) if NOTIFY_SMS_ENABLED is false in system_settings.
 */
async function sendSms(phone, message, transactionId = null, orderRef = null) {
    const enabled = await appSettings.getBool('NOTIFY_SMS_ENABLED', true);
    if (!enabled) {
        await log('SMS', phone, message, transactionId, orderRef, 'SIMULATED');
        console.log('[Notify] SMS skipped — NOTIFY_SMS_ENABLED is off');
        return;
    }
    await sms.send(phone, message);
    await log('SMS', phone, message, transactionId, orderRef);
}

/**
 * Log an email notification. Skipped if NOTIFY_EMAIL_ENABLED is false.
 */
async function sendEmail(email, subject, body, transactionId = null, orderRef = null) {
    const enabled = await appSettings.getBool('NOTIFY_EMAIL_ENABLED', true);
    const status = enabled ? (process.env.AT_API_KEY ? 'SENT' : 'SIMULATED') : 'SIMULATED';
    if (!enabled) console.log('[Notify] Email skipped — NOTIFY_EMAIL_ENABLED is off');
    await log('EMAIL', email, `${subject}: ${body}`, transactionId, orderRef, status);
}

module.exports = {
    sms:   (phone, msg, txId, ref)           => sendSms(phone, msg, txId, ref),
    email: (email, subject, body, txId, ref) => sendEmail(email, subject, body, txId, ref),
    push:  (userId, msg, txId, ref)          => log('PUSH', userId, msg, txId, ref),
};
