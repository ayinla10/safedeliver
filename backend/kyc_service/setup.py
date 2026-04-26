import os
from deepface import DeepFace
import cv2

def setup_kyc_service():
    print("🚀 Starting SafeDeliver KYC Service Setup...")
    
    # 1. Pre-download DeepFace models
    print("\n📦 Downloading AI models (this may take a few minutes)...")
    try:
        # Calling verify on dummy arrays triggers model download
        import numpy as np
        dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
        DeepFace.verify(dummy_img, dummy_img, model_name="VGG-Face", enforce_detection=False)
        print("✅ DeepFace VGG-Face model ready.")
    except Exception as e:
        print(f"⚠️ Warning during model pre-download: {e}")
        print("Model will download on first API call instead.")

    # 2. Check OpenCV Haar Cascades
    print("\n🔬 Verifying OpenCV face detection...")
    casc_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    if os.path.exists(casc_path):
        print(f"✅ Haar Cascade found at: {casc_path}")
    else:
        print("❌ Haar Cascade NOT found. Please check OpenCV installation.")

    # 3. Create temp directory
    if not os.path.exists("temp_processing"):
        os.makedirs("temp_processing")
        print("✅ Created temporary processing directory.")

    print("\n✨ Setup Complete! You can now run the service with:")
    print("   pip install -r requirements.txt")
    print("   python api.py")

if __name__ == "__main__":
    setup_kyc_service()
