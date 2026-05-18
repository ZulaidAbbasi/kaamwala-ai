# KaamWala AI — Local Environment Setup Guide

---

## Quick Summary

| Value | Classification | Where It Goes |
|-------|---------------|---------------|
| Firebase API Key, Auth Domain, Project ID, etc. | 📗 **PUBLIC** client config | Mobile `.env` file |
| Cloud Functions URL | 📗 **PUBLIC** | Mobile `.env` file |
| Gemini API Key | 🔴 **SECRET** | `firebase functions:config:set` only |
| Google Maps/Places API Key | 🔴 **SECRET** | `firebase functions:config:set` only |
| Service Account JSON | 🔴 **SECRET** | Never download — Cloud Functions auto-authenticates |

---

## Why Gemini and Maps Keys Must Stay Server-Side

1. **Billing exposure:** Anyone who decompiles your APK or inspects network traffic can extract keys embedded in client code. They can then make unlimited API calls billed to your account.

2. **Cannot restrict client keys effectively:** Client apps run on untrusted devices. Even "restricted" keys can be abused if the restriction method (app signature, IP, etc.) is bypassed.

3. **Professional architecture:** Production apps always proxy sensitive API calls through a backend. The backend holds the secret key, validates the request, and forwards it to the external API. This is what we do with Cloud Functions.

4. **Hackathon judges will check:** Judges look for proper security architecture. Keys in client code is a red flag that signals prototype-level thinking.

---

## Step 1: Create Mobile App `.env`

```powershell
# From project root (d:\Applications\Antigravity\Data\23)
copy .env.example .env
```

Open `.env` in your editor. Fill in values from Firebase Console:

### Where to find the values

1. Go to [Firebase Console](https://console.firebase.google.com/) → select `kaamwala-ai`
2. Click **⚙️ gear** → **Project settings**
3. Scroll to **"Your apps"** → find your Web app
4. Copy each value from the `firebaseConfig` object:

```
firebaseConfig.apiKey           →  EXPO_PUBLIC_FIREBASE_API_KEY
firebaseConfig.authDomain       →  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
firebaseConfig.projectId        →  EXPO_PUBLIC_FIREBASE_PROJECT_ID
firebaseConfig.storageBucket    →  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
firebaseConfig.messagingSenderId →  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
firebaseConfig.appId            →  EXPO_PUBLIC_FIREBASE_APP_ID
firebaseConfig.measurementId    →  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### Why these are NOT secrets

Firebase client config (the `apiKey`, `projectId`, etc.) is **designed to be public**. It identifies your project but does not grant admin access. Security comes from Firestore rules and Firebase Auth — not from hiding these values.

Google says in their docs: *"Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources; that can only be done with Firebase Security Rules."*

### Final `.env` looks like

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy_your_value
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=kaamwala-ai.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=kaamwala-ai
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=kaamwala-ai.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-your_id
EXPO_PUBLIC_API_BASE_URL=https://us-central1-kaamwala-ai.cloudfunctions.net/api
```

---

## Step 2: Set Backend Secrets (Cloud Functions)

These are **SECRET** — they NEVER go in `.env`, source code, or Git.

```powershell
# Login to Firebase CLI
firebase login

# Set Gemini key (from AI Studio)
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Set Maps/Places key (from GCP Console → Credentials)
firebase functions:config:set maps.api_key="YOUR_MAPS_API_KEY"

# Verify (shows masked output)
firebase functions:config:get
```

### Where to find the keys

- **Gemini:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Maps/Places:** [GCP Console → Credentials](https://console.cloud.google.com/apis/credentials) → `KaamWala Maps Key`

### How the backend accesses them

In Cloud Functions code (`functions/src/index.ts`):
```typescript
import * as functions from 'firebase-functions';
const geminiKey = functions.config().gemini.api_key;
const mapsKey = functions.config().maps.api_key;
```

These are injected by the Cloud Functions runtime at deploy time — never stored in files.

---

## Step 3: Deploy Cloud Functions

```powershell
# Build TypeScript
cd functions
npm run build

# Go back to root and deploy
cd ..
firebase deploy --only functions
```

Expected output:
```
✔ functions[api(us-central1)]: Successful create operation.
Function URL (api): https://us-central1-kaamwala-ai.cloudfunctions.net/api
```

Update `EXPO_PUBLIC_API_BASE_URL` in `.env` if the URL differs.

### Verify deployment

```powershell
# Test health endpoint (use Invoke-WebRequest on Windows)
Invoke-WebRequest -Uri "https://us-central1-kaamwala-ai.cloudfunctions.net/api/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected: `{"status":"ok","service":"KaamWala AI Backend",...}`

---

## Step 4: Run Mobile App Locally

```powershell
# From project root
npx expo start
```

Options:
- **Expo Go (phone):** Scan QR code with Expo Go app
- **Android emulator:** Press `a` in terminal
- **iOS simulator (Mac only):** Press `i` in terminal

---

## Step 5: Run Cloud Functions Locally (Optional)

Firebase emulators let you test functions without deploying:

```powershell
# From project root
firebase emulators:start --only functions,firestore

# Or from functions/
cd functions
npm run serve
```

This starts:
- Functions emulator on `http://localhost:5001`
- Firestore emulator on `http://localhost:8080`

Update `.env` temporarily to point at local emulator:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/kaamwala-ai/us-central1/api
```

> [!WARNING]
> When using emulators, `functions.config()` doesn't work. Create a `functions/.runtimeconfig.json` for local testing:
> ```json
> {
>   "gemini": { "api_key": "YOUR_KEY_FOR_LOCAL_ONLY" },
>   "maps": { "api_key": "YOUR_KEY_FOR_LOCAL_ONLY" }
> }
> ```
> Add `.runtimeconfig.json` to `.gitignore` (already covered by `functions/.env*`).

---

## Quick Reference

```
PROJECT ROOT
├── .env                    ← Firebase PUBLIC config (you create this)
├── .env.example            ← Template with placeholders (committed to git)
├── .gitignore              ← Excludes .env, secrets, build artifacts
│
├── src/                    ← Mobile app code
│   └── config/firebase.ts  ← Reads EXPO_PUBLIC_ vars from .env
│
├── functions/
│   ├── src/index.ts        ← Reads secrets from functions.config()
│   └── .runtimeconfig.json ← Local testing only (not committed)
│
└── SECRETS NEVER IN:
    ├── Source code (.ts, .tsx)
    ├── README.md
    ├── Git commits
    ├── Terminal output in recordings
    └── Screenshots or demo videos
```
