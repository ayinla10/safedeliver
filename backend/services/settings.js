/**
 * settings.js — Cached system settings loader
 *
 * Reads from system_settings table with a 60-second in-memory cache.
 * All backend modules call getSetting(key) instead of reading env vars directly.
 * Admin saving a setting takes effect within 60 seconds on all routes.
 */

const db = require('../db');

let cache = {};
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function loadAll() {
    const result = await db.query('SELECT key, value FROM system_settings');
    const fresh = {};
    result.rows.forEach(r => { fresh[r.key] = r.value; });
    cache = fresh;
    cacheLoadedAt = Date.now();
}

/**
 * Get a setting value. Falls back to `defaultValue` if not in DB.
 * Refreshes cache if stale (> 60s old).
 */
async function getSetting(key, defaultValue = null) {
    if (Date.now() - cacheLoadedAt > CACHE_TTL_MS) {
        try { await loadAll(); } catch (err) {
            console.warn('[Settings] Cache refresh failed:', err.message);
            // Return from stale cache or default — never crash
        }
    }
    const val = cache[key];
    return val !== undefined ? val : defaultValue;
}

/**
 * Get a setting as a float. Returns defaultValue if missing or not a number.
 */
async function getFloat(key, defaultValue) {
    const v = await getSetting(key, String(defaultValue));
    const n = parseFloat(v);
    return isNaN(n) ? defaultValue : n;
}

/**
 * Get a setting as an integer.
 */
async function getInt(key, defaultValue) {
    const v = await getSetting(key, String(defaultValue));
    const n = parseInt(v);
    return isNaN(n) ? defaultValue : n;
}

/**
 * Get a setting as a boolean ('true' → true, everything else → false).
 */
async function getBool(key, defaultValue = false) {
    const v = await getSetting(key, defaultValue ? 'true' : 'false');
    return v === 'true';
}

/**
 * Invalidate cache immediately (call after admin saves settings).
 */
function invalidate() {
    cacheLoadedAt = 0;
}

module.exports = { getSetting, getFloat, getInt, getBool, invalidate, loadAll };
