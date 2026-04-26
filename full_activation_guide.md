# Full System Activation Guide 🚀

To run the complete SafeDeliver ecosystem, you need to open **four separate terminals** and run each service simultaneously.

---

### **1. Backend (The Heart)** 🧠
This handles the database, API requests, and core logic.
*   **Directory**: `c:\Users\my\Desktop\SAFEDELIVER\backend`
*   **Command**:
    ```bash
    npm run dev
    ```

### **2. Frontend (The Web)** 🌐
The admin dashboard and seller web interface.
*   **Directory**: `c:\Users\my\Desktop\SAFEDELIVER\web`
*   **Command**:
    ```bash
    npm run dev
    ```

### **3. Mobile App (The App)** 📱
The customer/seller mobile experience.
*   **Directory**: `c:\Users\my\Desktop\SAFEDELIVER\mobile`
*   **Command**:
    ```bash
    npx expo start
    ```
    *(Scan the QR code with your phone after it starts)*

### **4. KYC AI Service (The Brain)** 🛂
The Python service that performs AI face matching and document verification.
*   **Directory**: `c:\Users\my\Desktop\SAFEDELIVER\backend\kyc_service`
*   **Command**:
    ```bash
    python api.py
    ```

---

> [!TIP]
> **Pro Tip**: Keep the KYC AI Service running if you plan on testing identity verification. The Backend API relies on it to approve/reject sellers automatically.

> [!IMPORTANT]
> **Database Connection**: Ensure your Supabase/PostgreSQL database is active for the Backend and Web services to load data correctly.
