const db = require('../db');
const { v4: uuid } = require('uuid');

async function holdFunds(transactionId, orderRef, amountGhs) {
    const ref = `SIM-HOLD-${uuid().slice(0, 8).toUpperCase()}`;
    await db.query(
        `INSERT INTO simulation_ledger (id, transaction_id, order_ref, entry_type, amount_ghs, reference, note)
     VALUES ($1, $2, $3, 'HOLD', $4, $5, $6)`,
        [uuid(), transactionId, orderRef, amountGhs, ref, `Buyer payment held in escrow`]
    );
    console.log(`[SimPay] HOLD: GHS ${(amountGhs / 100).toFixed(2)} for ${orderRef} (${ref})`);
    return ref;
}

async function releaseFunds(transactionId, orderRef, amountGhs, note = 'Released to seller') {
    const ref = `SIM-REL-${uuid().slice(0, 8).toUpperCase()}`;
    await db.query(
        `INSERT INTO simulation_ledger (id, transaction_id, order_ref, entry_type, amount_ghs, reference, note)
     VALUES ($1, $2, $3, 'RELEASE', $4, $5, $6)`,
        [uuid(), transactionId, orderRef, amountGhs, ref, note]
    );
    console.log(`[SimPay] RELEASE: GHS ${(amountGhs / 100).toFixed(2)} for ${orderRef}`);
    return ref;
}

async function refundFunds(transactionId, orderRef, amountGhs) {
    const ref = `SIM-REF-${uuid().slice(0, 8).toUpperCase()}`;
    await db.query(
        `INSERT INTO simulation_ledger (id, transaction_id, order_ref, entry_type, amount_ghs, reference, note)
     VALUES ($1, $2, $3, 'REFUND', $4, $5, $6)`,
        [uuid(), transactionId, orderRef, amountGhs, ref, 'Refunded to buyer']
    );
    console.log(`[SimPay] REFUND: GHS ${(amountGhs / 100).toFixed(2)} for ${orderRef}`);
    return ref;
}

async function recordFee(transactionId, orderRef, feeAmount) {
    const ref = `SIM-FEE-${uuid().slice(0, 8).toUpperCase()}`;
    await db.query(
        `INSERT INTO simulation_ledger (id, transaction_id, order_ref, entry_type, amount_ghs, reference, note)
     VALUES ($1, $2, $3, 'FEE', $4, $5, $6)`,
        [uuid(), transactionId, orderRef, feeAmount, ref, 'Platform fee deducted']
    );
    return ref;
}

module.exports = { holdFunds, releaseFunds, refundFunds, recordFee };
