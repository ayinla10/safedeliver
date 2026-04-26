const FormData = require('form-data');
const axios = require('axios');
const db = require('../db');

// Python AI Service configuration
const KYC_AI_URL = process.env.KYC_AI_URL || 'http://localhost:8000/verify-kyc';

async function verifyApplication(applicationId) {
    try {
        // 1. Fetch application details
        const appRes = await db.query('SELECT * FROM kyc_applications WHERE id = $1', [applicationId]);
        if (appRes.rows.length === 0) return;
        const app = appRes.rows[0];

        console.log(`🔍 Starting automated verification for KYC #${applicationId}`);

        // 2. Check if we have images to verify (Tier 2 only)
        if (!app.gov_id_url || !app.selfie_url) {
            console.log(`ℹ️ Skipping biometric AI verification for KYC #${applicationId} (Missing images/Tier 3 context).`);
            return;
        }

        // 3. Download images (with 10s timeout)
        const [idBuffer, selfieBuffer] = await Promise.all([
            axios.get(app.gov_id_url, { responseType: 'arraybuffer', timeout: 10000 }).then(r => Buffer.from(r.data)),
            axios.get(app.selfie_url, { responseType: 'arraybuffer', timeout: 10000 }).then(r => Buffer.from(r.data))
        ]);

        // 4. Call Python Face Verification AI
        console.log('👤 Sending images to AI verification service...');
        
        const formData = new FormData();
        formData.append('id_image', idBuffer, { filename: 'id.jpg', contentType: 'image/jpeg' });
        formData.append('selfie_image', selfieBuffer, { filename: 'selfie.jpg', contentType: 'image/jpeg' });

        const aiResponse = await axios.post(KYC_AI_URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 60000 // 60s timeout for ML processing
        });

        const { verified, match_score, message } = aiResponse.data;
        console.log(`✅ AI Response: ${message} (Score: ${match_score}%)`);

        // 5. Update Database
        await db.query(`
            UPDATE kyc_applications 
            SET 
                auto_verify_score = $1,
                is_auto_verified = $2,
                verification_error = $3,
                updated_at = NOW()
            WHERE id = $4
        `, [
            match_score, 
            verified,
            (!verified && match_score === 0) ? message : null,
            applicationId
        ]);

        console.log(`✨ Automated verification complete for KYC #${applicationId}. Results saved for Admin review.`);

    } catch (err) {
        console.error(`❌ Verification pipeline error for KYC #${applicationId}:`, err);
        await db.query('UPDATE kyc_applications SET verification_error = $1 WHERE id = $2', [err.message, applicationId]);
    }
}

module.exports = { verifyApplication };
