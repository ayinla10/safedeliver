const db = require('../db');
const sim = require('./simulationEngine');

const VALID_TRANSITIONS = {
    ACCEPTED: ['PAID'],
    INITIATED: ['PAID'],
    PAID: ['SHIPPED', 'DISPUTED'],
    SHIPPED: ['DELIVERED', 'DISPUTED', 'AUTO_RELEASED'],
    DELIVERED: ['RELEASED'],
    DISPUTED: ['RELEASED', 'REFUNDED'],
};

async function transition(transactionId, newStatus) {
    const result = await db.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    if (result.rows.length === 0) throw new Error('Transaction not found');
    const tx = result.rows[0];
    const allowed = VALID_TRANSITIONS[tx.status];
    if (!allowed || !allowed.includes(newStatus)) {
        throw new Error(`Cannot transition from ${tx.status} to ${newStatus}`);
    }
    const timestamps = { PAID: 'paid_at', SHIPPED: 'shipped_at', DELIVERED: 'delivered_at', RELEASED: 'released_at', AUTO_RELEASED: 'released_at', REFUNDED: 'released_at' };
    const tsCol = timestamps[newStatus];
    if (tsCol) {
        await db.query(`UPDATE transactions SET status = $1, ${tsCol} = NOW(), updated_at = NOW() WHERE id = $2`, [newStatus, transactionId]);
    } else {
        await db.query('UPDATE transactions SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, transactionId]);
    }
    return { ...tx, status: newStatus };
}

async function releaseFundsToSeller(transactionId) {
    const result = await db.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    const tx = result.rows[0];
    await sim.releaseFunds(transactionId, tx.order_ref, tx.seller_payout_amount, 'Payout to seller');
    if (tx.platform_fee > 0) await sim.recordFee(transactionId, tx.order_ref, tx.platform_fee);
}

module.exports = { transition, releaseFundsToSeller, VALID_TRANSITIONS };
