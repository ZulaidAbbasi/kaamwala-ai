# KaamWala AI — Local Setup Guide

**Purpose:** Exactly how to configure your local environment to run the app.

---

## Understanding: What Is Public vs What Is Secret

| Value | Classification | Where It Goes | Why |
|-------|---------------|---------------|-----|
| Firebase API Key (`AIzaSy...`) | 📗 PUBLIC client config | `.env` file (mobile) | Identifies your Firebase project — NOT a secret |
| Firebase Auth Domain | 📗 PUBLIC | `.env` file | Public URL for auth |
| Firebase Project ID | 📗 PUBLIC | `.env` file | Project identifier |
| Firebase Storage Bucket | 📗 PUBLIC | `.env` file | Storage URL |
| Firebase Messaging Sender ID | 📗 PUBLIC | `.env` file | Push notification config |
| Firebase App ID | 📗 PUBLIC | `.env` file | App identifier |
| Firebase Measurement ID | 📗 PUBLIC | `.env` file | Analytics |
| Cloud Functions URL | 📗 PUBLIC | `.env` file | Backend URL |
| **Gemini API Key** | 🔴 **SECRET** | **Backend env only** | Direct API access — billing |
| **Google Maps/Places API Key** | 🔴 **SECRET** | **Backend env only** | Direct API access — billing |
| **Service Account JSON** | 🔴 **SECRET** | **Never download** | Full project access |

---

## Step 1: Create .env File (Mobile App Config)

```powershell
# From project root
copy .env.example .env
```

Then open `.env` in your editor and fill in values from Firebase Console:

### Where to find the values:

1. Go to → [Firebase Console](https://console.firebase.google.com/)
2. Select `kaamwala-ai` project
3. Click the **gear icon** (⚙️) → **Project settings**
4. Scroll to **"Your apps"** section
5. Find your web app (or click "Add app" → Web if not created)
6. You'll see a config block like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // ← EXPO_PUBLIC_FIREBASE_API_KEY
  authDomain: "kaamwala-ai.firebaseapp.com",  // ← EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "kaamwala-ai",         // ← EXPO_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "kaamwala-ai.firebasestorage.app",  // ← EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",   // ← EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc",           // ← EXPO_PUBLIC_FIREBASE_APP_ID
  measurementId: "G-XXXXXXXXXX"     // ← EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};
```

7. Copy each value into your `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=kaamwala-ai.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=kaamwala-ai
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=kaamwala-ai.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
EXPO_PUBLIC_API_BASE_URL=https://us-central1-kaamwala-ai.cloudfunctions.net/api
```

> [!NOTE]
> The `EXPO_PUBLIC_API_BASE_URL` will be confirmed after you deploy Cloud Functions in Step 3. Use the default for now.

---

## Step 2: Set Backend Secrets (Gemini + Maps Keys)

These are **SECRET** and go ONLY into the backend environment — never in the `.env` file, never in source code.

```powershell
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set Gemini API key (from AI Studio)
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY_HERE"

# Set Google Maps/Places API key (from GCP Console)
firebase functions:config:set maps.api_key="YOUR_MAPS_API_KEY_HERE"

# Verify they're set (shows masked values)
firebase functions:config:get
```

### Where to find your keys:

- **Gemini API Key:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Maps/Places API Key:** [GCP Console → Credentials](https://console.cloud.google.com/apis/credentials) → the key named `KaamWala Maps Key`

> [!CAUTION]
> Do NOT paste these keys into the `.env` file, source code, chat messages, or screenshots. They go ONLY into `firebase functions:config:set`.

---

## Step 3: Deploy Cloud Functions

```powershell
# Build the functions
cd functions
npm run build
cd ..

# Deploy to Firebase
firebase deploy --only functions
```

After deploy, you'll see output like:
```
✔ functions[api(us-central1)]: Successful create operation.
Function URL (api): https://us-central1-kaamwala-ai.cloudfunctions.net/api
```

**Update your `.env`** if the URL differs:
```env
EXPO_PUBLIC_API_BASE_URL=https://us-central1-kaamwala-ai.cloudfunctions.net/api
```

### Verify deployment:

```powershell
# Test health check
curl https://us-central1-kaamwala-ai.cloudfunctions.net/api/api/health
```

Expected response:
```json
{"status":"ok","service":"KaamWala AI Backend","timestamp":"...","version":"1.0.0"}
```

---

## Step 4: Start the Mobile App

```powershell
# From project root
npx expo start
```

Then:
1. Install **Expo Go** on your phone (App Store / Play Store)
2. Scan the QR code from the terminal
3. The app should:
   - Show "Initializing KaamWala AI..." loading screen
   - Auto sign in anonymously
   - Show the Home screen with demo request button

---

## Step 5: Verify Everything Works

Open the app → tap **"⚡ System Status"** → check all items:

| Item | Expected |
|------|----------|
| Firebase Firestore | ✅ Connected |
| Firebase Auth | ✅ Connected, User: abc12... |
| Backend API | ✅ Reachable |
| Gemini API (via Backend) | ✅ Available |
| Google Places (via Backend) | ✅ Available |

If any item shows ❌:
- **Firestore:** Check `.env` Firebase config values
- **Auth:** Check that Anonymous Auth is enabled in Firebase Console
- **Backend:** Check that Cloud Functions deployed, check URL in `.env`
- **Gemini/Places:** Check that backend secrets are set via `firebase functions:config:set`

---

## Quick Reference: Where Secrets Live

```
MOBILE APP (.env)               BACKEND (firebase config)
├── Firebase client config      ├── gemini.api_key ← SECRET
│   (all EXPO_PUBLIC_ vars)     └── maps.api_key   ← SECRET
│   = PUBLIC, not secrets
└── Backend URL
    = PUBLIC
```

**Rule:** If you can find it in the Firebase Console "Your apps" config block, it's public. Everything else is secret and goes in the backend only.
