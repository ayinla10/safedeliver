import os
import cv2
import time
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from deepface import DeepFace
import shutil
import uuid

app = FastAPI(title="SafeDeliver KYC AI Service")

# Create temporary directory for processing
TEMP_DIR = "temp_processing"
os.makedirs(TEMP_DIR, exist_ok=True)

# Path to the default OpenCV Haar Cascade for face detection
CASC_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(CASC_PATH)

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] 🤖 AI_SERVICE: {msg}")

@app.on_event("startup")
async def startup_event():
    log("Starting SafeDeliver KYC AI Service...")
    log("Pre-loading AI models (VGG-Face). This might take a moment if weights are not downloaded...")
    try:
        # Pre-loading the model ensures weights are downloaded at startup
        DeepFace.build_model("VGG-Face")
        log("✅ VGG-Face model loaded and ready.")
        log("🚀 KYC AI Service is now 100% operational on port 8000.")
    except Exception as e:
        log(f"❌ Error during model pre-load: {str(e)}")

def extract_face(image_path, output_name):
    """Detects and crops the face from an image."""
    log(f"Processing image: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        return None, "Invalid image format"
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        log("⚠️ No face detected in image.")
        return None, "No face detected"
    if len(faces) > 1:
        log("⚠️ Multiple faces detected in image.")
        return None, "Multiple faces detected"
    
    (x, y, w, h) = faces[0]
    # Add a little padding
    padding = int(w * 0.1)
    y1, y2 = max(0, y - padding), min(img.shape[0], y + h + padding)
    x1, x2 = max(0, x - padding), min(img.shape[1], x + w + padding)
    
    face_img = img[y1:y2, x1:x2]
    output_path = os.path.join(TEMP_DIR, output_name)
    cv2.imwrite(output_path, face_img)
    log(f"✅ Face extracted and saved to: {output_path}")
    return output_path, None

@app.post("/verify-kyc")
async def verify_kyc(id_image: UploadFile = File(...), selfie_image: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    log(f"📥 New KYC Request Received [Session: {session_id}]")
    
    id_temp_path = os.path.join(TEMP_DIR, f"{session_id}_id_raw.jpg")
    selfie_temp_path = os.path.join(TEMP_DIR, f"{session_id}_selfie_raw.jpg")
    
    try:
        # 1. Save uploaded files
        log("Saving uploaded images...")
        with open(id_temp_path, "wb") as buffer:
            shutil.copyfileobj(id_image.file, buffer)
        with open(selfie_temp_path, "wb") as buffer:
            shutil.copyfileobj(selfie_image.file, buffer)
            
        # 2. Extract face from ID
        id_face_path, id_error = extract_face(id_temp_path, f"{session_id}_id_face.jpg")
        if id_error:
            return {
                "verified": False,
                "match_score": 0,
                "message": f"KYC Failed: {id_error} in ID"
            }
            
        # 3. Extract face from Selfie (for consistency)
        selfie_face_path, selfie_error = extract_face(selfie_temp_path, f"{session_id}_selfie_face.jpg")
        if selfie_error:
            return {
                "verified": False,
                "match_score": 0,
                "message": f"KYC Failed: {selfie_error} in Selfie"
            }
            
        # 4. Perform Verification
        log("👤 Performing DeepFace identity comparison...")
        try:
            # We use VGG-Face by default as it is robust for IDs
            start_time = time.time()
            result = DeepFace.verify(
                img1_path=id_face_path, 
                img2_path=selfie_face_path,
                enforce_detection=False, # We already detected with OpenCV
                model_name="VGG-Face",
                distance_metric="cosine"
            )
            duration = round(time.time() - start_time, 2)
            
            # 5. Calculate Score
            distance = result["distance"]
            match_score = max(0, min(100, round((1 - distance) * 100, 2)))
            verified = result["verified"]
            
            log(f"✅ Comparison Finished in {duration}s. Match: {match_score}%")
            
            return {
                "verified": verified,
                "match_score": match_score,
                "message": "KYC Approved" if verified else "KYC Failed: Face mismatch"
            }
            
        except Exception as e:
            log(f"❌ DeepFace Verification Error: {str(e)}")
            return {
                "verified": False,
                "match_score": 0,
                "message": f"Verification Error: {str(e)}"
            }
            
    finally:
        # Cleanup temp files
        for p in [id_temp_path, selfie_temp_path]:
            if os.path.exists(p): os.remove(p)
        if 'id_face_path' in locals() and id_face_path and os.path.exists(id_face_path): os.remove(id_face_path)
        if 'selfie_face_path' in locals() and selfie_face_path and os.path.exists(selfie_face_path): os.remove(selfie_face_path)

if __name__ == "__main__":
    import uvicorn
    log("Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
