# KaamWala AI — Mobile App Link

**Platform:** Android  
**Build:** EAS Preview APK  
**Package:** com.kaamwala.ai

---

## APK Download

**EAS Build Link:** `[PASTE EAS BUILD URL HERE AFTER BUILD COMPLETES]`

---

## Install Instructions

1. Download the `.apk` file from the EAS build link above
2. On your Android device, go to **Settings → Security → Install Unknown Apps**
3. Allow installation from your browser/file manager
4. Open the downloaded `.apk` file
5. Tap **Install**
6. Open **KaamWala AI** from your app drawer

---

## Demo Flow

1. App opens to **Home Screen** with KaamWala AI branding
2. Tap **"Run Full Agentic Workflow"** to test the complete pipeline
3. Or tap **"Step-by-Step Demo"** to walk through each stage manually
4. The demo request is prefilled: *"AC bilkul kaam nahi kar raha..."*
5. All backend calls go to the live deployed API

---

## Technical Details

- Built with Expo/React Native
- Backend: Firebase Cloud Functions (deployed)
- Database: Cloud Firestore
- AI: Google Gemini 2.0 Flash
- APIs: Google Places, Geocoding, Distance Matrix
- No secrets in the APK — all sensitive keys are backend-only
