const tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs');
const canvas = require('canvas');
const axios = require('axios');
const db = require('../db');
const path = require('path');
const fs = require('fs');

let faceapi;
let modelsLoaded = false;

// Patch face-api environment for Node.js
const { Canvas, Image, ImageData } = canvas;

async function loadModels() {
    if (modelsLoaded) return;
    
    // Lazy load face-api to avoid startup crashes
    if (!faceapi) {
        faceapi = require('@vladmandic/face-api/dist/face-api.node.js');
        faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    }

    const modelPath = path.join(__dirname, '../models');
    
    // Load models from local files
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    
    modelsLoaded = true;
    console.log('🤖 KYC Machine Learning models loaded successfully');
}

async function verifyApplication(applicationId) {
    try {
        await loadModels();

        // 1. Fetch application details
        const appRes = await db.query('SELECT * FROM kyc_applications WHERE id = $1', [applicationId]);
        if (appRes.rows.length === 0) return;
        const app = appRes.rows[0];

        console.log(`🔍 Starting automated verification for KYC #${applicationId}`);

        // 2. Download images
        const [idBuffer, selfieBuffer] = await Promise.all([
            axios.get(app.gov_id_url, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
            axios.get(app.selfie_url, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data))
        ]);

        // 3. OCR on ID Document
        console.log('📝 Performing OCR on ID document...');
        const ocrResult = await tesseract.recognize(idBuffer, 'eng');
        const ocrText = ocrResult.data.text;
        
        // 4. Face Matching
        console.log('👤 Performing face detection and matching...');
        const idImg = await canvas.loadImage(idBuffer);
        const selfieImg = await canvas.loadImage(selfieBuffer);

        const idDetection = await faceapi.detectSingleFace(idImg).withFaceLandmarks().withFaceDescriptor();
        const selfieDetection = await faceapi.detectSingleFace(selfieImg).withFaceLandmarks().withFaceDescriptor();

        let matchScore = 0;
        let isAutoVerified = false;

        if (idDetection && selfieDetection) {
            const distance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetection.descriptor);
            // distance < 0.6 is a good match. 0.0 is perfect, 1.0 is totally different.
            matchScore = Math.max(0, (1 - distance) * 100).toFixed(2);
            if (distance < 0.5) isAutoVerified = true;
            console.log(`✅ Face match score: ${matchScore}% (distance: ${distance.toFixed(3)})`);
        } else {
            console.log('⚠️ Face detection failed on one or both images');
        }

        // 5. Update Database
        await db.query(`
            UPDATE kyc_applications 
            SET 
                auto_verify_score = $1,
                ocr_data = $2,
                is_auto_verified = $3,
                verification_error = $4,
                updated_at = NOW()
            WHERE id = $5
        `, [
            matchScore, 
            JSON.stringify({ raw_text: ocrText.substring(0, 1000) }), 
            isAutoVerified,
            (!idDetection || !selfieDetection) ? 'Face detection failed' : null,
            applicationId
        ]);

        console.log(`✨ Automated verification complete for KYC #${applicationId}`);

    } catch (err) {
        console.error(`❌ Verification pipeline error for KYC #${applicationId}:`, err);
        await db.query('UPDATE kyc_applications SET verification_error = $1 WHERE id = $2', [err.message, applicationId]);
    }
}

module.exports = { verifyApplication };
