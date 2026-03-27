require('dotenv').config();
const db = require('./db');
db.query('SELECT order_ref, buyer_token, buyer_name, buyer_phone, status FROM transactions WHERE order_ref = $1', ['SD-MMK5B31F-PLQ'])
    .then(r => {
        if (r.rows.length === 0) { console.log('Order not found'); }
        else {
            const row = r.rows[0];
            console.log('Order:', row.order_ref);
            console.log('Buyer:', row.buyer_name, row.buyer_phone);
            console.log('Status:', row.status);
            console.log('Tracking link: http://localhost:3000/track/' + row.buyer_token);
        }
        process.exit();
    });
