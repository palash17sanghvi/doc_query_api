# DocQuery | Secure Document Vault

DocQuery is a decoupled, full-stack secure document management system. It features a centralized REST API backend that simultaneously serves a Vanilla JavaScript web application and a native SwiftUI iOS mobile client.

## 🏗 Architecture Stack

**Backend (The Engine)**
* Python
* Django & Django REST Framework (DRF)
* SQLite Database
* Token-Based Authentication

**Web Client (The Browser View)**
* HTML5 / CSS3 / Vanilla JavaScript
* Bootstrap 5
* Asynchronous Fetch API for REST communication

**Mobile Client (The Native View)**
* Swift & SwiftUI
* Combine Framework
* Native URLSession for network requests

## ✨ Key Engineering Features
* **Decoupled Monorepo:** The backend, web frontend, and mobile client operate completely independently but are housed in a single organized repository.
* **Stateless Security:** Bypasses traditional session cookies in favor of secure, stateless cryptographic Token Authentication.
* **Cross-Platform Sync:** Documents created on the web dashboard instantly sync to the native iOS application via the centralized REST API.
* **CORS Configuration:** Custom middleware configured to securely bridge the backend with multiple independent clients.

## 🚀 How to Run Locally

### 1. Start the Backend API
```bash
# Clone the repo and navigate to the folder
git clone https://github.com/palash17sanghvi/doc_query_api.git
cd doc_query_api

# Activate virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers

# Run database migrations and start server
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Launch the Web App
Simply navigate to the `frontend` directory and open `index.html` in any modern web browser.

### 3. Launch the iOS App
Open the `DocQueryiOS` folder using **Xcode**. Ensure your Mac's local IP address is updated in `NetworkManager.swift`, and hit the **Play** button to launch the iPhone Simulator.

---
*Engineered by Palash Sanghvi*