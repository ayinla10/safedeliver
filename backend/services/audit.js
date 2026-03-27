const db = require('../db');
const { v4: uuid } = require('uuid');

async function log(actorType, actorId, action, entityType, entityId, ip, metadata = {}) {
    await db.query(
        `INSERT INTO audit_logs (id, actor_type, actor_id, action, entity_type, entity_id, ip_address, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuid(), actorType, actorId, action, entityType, entityId, ip, JSON.stringify(metadata)]
    );
}

module.exports = { log };
