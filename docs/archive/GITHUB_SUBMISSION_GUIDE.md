# KaamWala AI — GitHub Submission Guide

**Repository Name:** `kaamwala-ai`

---

## Repository Setup

### Step 1: Initialize (if not already)

```bash
cd d:\Applications\Antigravity\Data\23
git init
git remote add origin https://github.com/[username]/kaamwala-ai.git
```

### Step 2: Verify .gitignore

Ensure these are excluded:

```
node_modules/
functions/node_modules/
functions/lib/
.env
functions/.env
*.tsbuildinfo
.expo/
dist/
```

### Step 3: Verify .env.example

```bash
# .env.example — NO real keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Step 4: Security Audit

```bash
# Search for any leaked keys
git grep -i "AIza"          # Google API key prefix
git grep -i "sk-"           # OpenAI/other key prefix
git grep -i "api_key="      # Generic key assignment
git grep -i "password"      # Password strings
```

If any results contain real keys: **DO NOT PUSH.** Remove them first with `git filter-branch` or BFG Repo Cleaner.

---

## Recommended Folder Structure

```
kaamwala-ai/
├── App.tsx                    # Root navigation (17 screens)
├── README.md                  # Mandatory — complete
├── .env.example               # Key placeholders
├── .gitignore                 # Excludes secrets + build artifacts
├── package.json
├── tsconfig.json
├── app.json                   # Expo config
│
├── src/
│   ├── screens/               # 17 React Native screens
│   ├── services/              # Auth, API clients, Firebase
│   ├── config/                # API endpoints, Firebase config, constants
│   ├── types/                 # TypeScript types
│   ├── store/                 # State management
│   └── components/            # Reusable components
│
├── functions/
│   ├── src/
│   │   ├── index.ts           # Express routes (13 endpoints)
│   │   ├── endpoints/         # 11 endpoint handlers
│   │   ├── agents/            # 2 agent modules
│   │   ├── services/          # Gemini, Maps, booking, ranking, etc.
│   │   ├── types/             # Backend types
│   │   └── utils/             # Logger, helpers
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                      # 29 documentation files
│   ├── MANDATORY_SUBMISSION_CHECKLIST.md
│   ├── DEMO_VIDEO_SCRIPT.md
│   ├── DEMO_VIDEO_SHOT_LIST.md
│   ├── ANTIGRAVITY_USAGE_VIDEO_SCRIPT.md
│   ├── ANTIGRAVITY_USAGE_SHOT_LIST.md
│   ├── ANTIGRAVITY_TRACE_EXPORT_GUIDE.md
│   ├── FINAL_QA_CHECKLIST.md
│   ├── GITHUB_SUBMISSION_GUIDE.md
│   ├── VERIFICATION_LOG.md
│   ├── API_SETUP_GUIDE.md
│   ├── BASELINE_COMPARISON.md
│   ├── COST_SCALABILITY.md
│   ├── PRIVACY_SAFETY.md
│   ├── AGENT_DESIGN.md
│   └── ... (14 more)
│
└── docs/antigravity-evidence/  # Antigravity usage proof
    ├── README.md
    ├── screenshots/
    └── logs/
```

---

## Commit Strategy

### Clean commit history

```bash
# Option A: Single clean commit (simple)
git add -A
git commit -m "KaamWala AI — Agentic Service Orchestrator (Hackathon Submission)"
git push origin main

# Option B: Phase-based commits (shows progression)
git add functions/
git commit -m "feat: backend — 11 endpoints, 2 agents, Gemini + Places + Geocoding"

git add src/
git commit -m "feat: mobile — 17 screens with agentic workflow UI"

git add docs/
git commit -m "docs: 29 documentation files — submission guides, verification, architecture"

git add .
git commit -m "chore: config, types, and remaining files"

git push origin main
```

---

## Pre-Push Checklist

```
[ ] .env and functions/.env are NOT tracked
[ ] No API keys in any committed file
[ ] README.md renders correctly on GitHub
[ ] All TypeScript compiles clean
[ ] Repository is set to Public
[ ] Repository description: "AI Service Orchestrator for Pakistan's Informal Economy — #AISeekho Hackathon"
[ ] Topics: google-ai, gemini, firebase, react-native, hackathon, pakistan
```

---

## After Push

```
[ ] Visit GitHub repo in browser — verify README renders
[ ] Click through folder structure — verify files present
[ ] Check no .env files visible
[ ] Copy repo URL for submission form
```
