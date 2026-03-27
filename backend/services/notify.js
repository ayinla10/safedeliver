const db = require('../db');
const { v4: uuid } = require('uuid');

async function send(channel, recipientId, message, transactionId = null, orderRef = null) {
    const status = process.env.NODE_ENV === 'production' ? 'SENT' : 'SIMULATED';
    await db.query(
        `INSERT INTO notifications (id, transaction_id, order_ref, channel, recipient_id, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuid(), transactionId, orderRef, channel, recipientId, message, status]
    );
    console.log(`[Notify] ${channel} → ${recipientId}: ${message.substring(0, 80)}...`);
}

module.exports = {
    sms: (phone, msg, txId, ref) => send('SMS', phone, msg, txId, ref),
    email: (email, subject, body, txId, ref) => send('EMAIL', email, `${subject}: ${body}`, txId, ref),
    push: (userId, msg, txId, ref) => send('PUSH', userId, msg, txId, ref),
    whatsapp: (phone, msg, txId, ref) => send('WHATSAPP_SIM', phone, msg, txId, ref),
};
