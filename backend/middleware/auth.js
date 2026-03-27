const jwt = require('jsonwebtoken');
const db = require('../db');

function authenticateSeller(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.seller = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function authenticateAdmin(req, res, next) {
    authenticateSeller(req, res, () => {
        if (!req.seller.is_admin) return res.status(403).json({ error: 'Admin access required' });
        next();
    });
}

function authenticateBuyer(req, res, next) {
    const token = req.headers['x-buyer-token'] || req.body?.token || req.query?.token;
    if (token) {
        req.buyerToken = token;
        return next();
    }
    return res.status(401).json({ error: 'Buyer token required' });
}

module.exports = { authenticateSeller, authenticateAdmin, authenticateBuyer };
