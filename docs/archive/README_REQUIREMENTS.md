# KaamWala AI — README Requirements

**Purpose:** Define exactly what the README.md must contain for hackathon judges.

---

## Required Sections

### 1. Project Header

```markdown
# KaamWala AI — Agentic AI Service Orchestrator

> AI-powered service discovery and booking for Pakistan's informal economy.
> Built for #AISeekho 2026 Google Antigravity Hackathon — Challenge 2.
```

- Project name and one-line description
- Hackathon name and challenge number
- Badge/shield for tech stack (optional but impressive)

---

### 2. Problem Statement

Explain the problem in 3–5 sentences:
- Pakistan's informal economy lacks structured service discovery
- People rely on word of mouth, WhatsApp groups, manual searching
- No transparent pricing, no fallback plan, no audit trail
- Language barrier: most tools don't understand Urdu or Roman Urdu

---

### 3. Solution Overview

Explain KaamWala AI in 3–5 sentences:
- Agentic AI orchestrator that understands multilingual service requests
- Discovers real providers via Google Places/Maps APIs
- Ranks providers using Gemini multi-factor reasoning
- Provides transparent price estimates
- Handles full lifecycle: booking, follow-up, cancellation recovery
- Complete agent trace for every decision

---

### 4. Architecture Diagram

Embed the Mermaid diagram from the execution plan, or include a PNG screenshot.

---

### 5. Agentic Loop

Show the 7-step table:
Observe → Understand → Reason → Decide → Act → Evaluate → Recover

---

### 6. Tech Stack

| Technology | Purpose |
|-----------|---------|
| React Native Expo + TypeScript | Mobile app |
| Gemini API | Multilingual NLU, reasoning, ranking |
| Google Places API (New) | Real provider discovery |
| Geocoding API | Location resolution |
| Distance Matrix API | Travel time calculation |
| Firebase Firestore | Data persistence, agent traces |

---

### 7. Features — Real vs Simulated

Two tables:
- 🟢 Real API-powered features (list all 10)
- 🔸 Simulated features (list all 9, clearly labeled)

---

### 8. Demo Request

```
"AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai."
```

Show what the app does with this request, step by step.

---

### 9. Screenshots

Include 4–6 screenshots:
1. Request input screen
2. Parsed intent result
3. Provider list with rankings
4. Agent trace viewer
5. Booking simulation
6. Baseline comparison

**Store screenshots in `assets/screenshots/`**

---

### 10. Setup Instructions

```markdown
## Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Google Cloud project with APIs enabled
- Firebase project with Firestore

### Installation
1. Clone the repository
2. Copy .env.example to .env and fill in your keys
3. npm install
4. npx expo start

### Required API Keys
- GOOGLE_MAPS_API_KEY (Places, Geocoding, Distance Matrix)
- GEMINI_API_KEY (Generative Language API)
- Firebase config (from Firebase Console)
```

---

### 11. Project Structure

Show the folder structure from `GITHUB_SUBMISSION_GUIDE.md`.

---

### 12. How It Works

Brief explanation of the agentic flow — 1 paragraph per step.

---

### 13. Hackathon Submission

| Deliverable | Link |
|------------|------|
| Mobile App | [link] |
| GitHub Repo | [link] |
| Demo Video | [link] |
| Antigravity Usage Video | [link] |
| Antigravity Traces | `antigravity-traces/` |

---

### 14. Team

```markdown
## Team
- [Your Name] — Full Stack Developer
```

---

### 15. License

```markdown
## License
MIT License — see LICENSE file
```

---

## README Quality Checklist

```
[ ] Project name and description are clear
[ ] Problem statement is compelling (judges understand WHY)
[ ] Solution overview is concise
[ ] Architecture diagram renders correctly
[ ] Tech stack is complete
[ ] Real vs simulated features clearly separated
[ ] Demo request example is included
[ ] Screenshots are embedded and load correctly
[ ] Setup instructions work from scratch
[ ] Folder structure is shown
[ ] Submission links are filled in (Day 5)
[ ] No API keys anywhere in README
[ ] No broken images or links
[ ] Professional tone throughout
[ ] Renders correctly on GitHub (test by pushing)
```
