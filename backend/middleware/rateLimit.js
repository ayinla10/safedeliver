const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many auth attempts' } });

module.exports = { generalLimiter, authLimiter };
