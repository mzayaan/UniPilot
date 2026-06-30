# UniPilot — Setup Guide

## What's Already Done ✅
- Supabase project created: `deyxgozlaemqsyqxlphe` (ap-south-1)
- All 13 database tables created with full schema
- Row Level Security policies applied (users can only access their own data)
- Auto-trigger: new user → creates users_profile + free subscription row
- Full React Native / Expo project scaffolded (44 files)

---

## Step 1: Install Dependencies

Open a terminal in the `UniPilot` folder and run:

```bash
npm install
```

---

## Step 2: Add Your Google Gemini API Key (Free)

To enable the AI Study Coach, add a free Gemini API key as a Supabase secret.

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and click **Get API key** — it's completely free, no credit card needed
2. In the [Supabase Dashboard](https://app.supabase.com/project/deyxgozlaemqsyqxlphe):
   - Go to **Edge Functions → Manage secrets**
   - Add: `GEMINI_API_KEY` = your key from Google AI Studio

Then deploy the Edge Function:

```bash
npx supabase functions deploy ai-study-coach --project-ref deyxgozlaemqsyqxlphe
```

> **Free tier limits**: 1,500 requests/day, 15 requests/minute — plenty for student usage.

---

## Step 3: Add Your RevenueCat API Key

1. Create a RevenueCat account at [revenuecat.com](https://revenuecat.com)
2. Create a new project → link your Google Play app
3. Copy your Google API key
4. Open `.env` and replace `YOUR_REVENUECAT_GOOGLE_API_KEY`

---

## Step 4: Add App Assets

Create placeholder images in the `assets/` folder:
- `icon.png` (1024×1024)
- `splash.png` (1284×2778 or larger)
- `adaptive-icon.png` (1024×1024, foreground only, transparent BG)
- `favicon.png` (196×196)
- `notification-icon.png` (96×96, white icon)

---

## Step 5: Run the App (Development)

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app (Android) to preview it.

---

## Step 6: EAS Build (Production APK/AAB)

1. Install EAS CLI:
```bash
npm install -g eas-cli
eas login
```

2. Link your project:
```bash
eas build:configure
```

3. Build a preview APK (internal testing):
```bash
eas build --platform android --profile preview
```

4. Build a production AAB for Play Store:
```bash
eas build --platform android --profile production
```

---

## Step 7: Google Play Setup

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create a new app: **UniPilot**
3. Set up Internal Testing track
4. Upload the `.aab` from Step 6
5. Complete the Data Safety form:
   - Collects: email address, name, academic data
   - Shared: none (stays in Supabase, your database)
   - Encrypted in transit: yes

---

## Step 8: Set Up Subscriptions in Play Console

In Play Console → Monetize → Subscriptions, create:

| Product ID | Name | Price |
|---|---|---|
| `pro_monthly` | Pro Monthly | MUR 199 |
| `pro_yearly` | Pro Yearly | MUR 2,149 |
| `pro_plus_monthly` | Pro+ Monthly | MUR 299 |
| `pro_plus_yearly` | Pro+ Yearly | MUR 3,229 |

Then link these to RevenueCat entitlements in your RevenueCat dashboard.

---

## Project Structure

```
UniPilot/
├── app/
│   ├── (auth)/          # Welcome, Login, Register, Forgot Password
│   ├── (tabs)/          # Dashboard, Modules, Tasks, Timetable, Profile
│   ├── modules/         # Module detail + Add module
│   ├── tasks/           # Task detail + Add task
│   ├── grades/          # Grade calculator per module
│   ├── ai/              # AI Study Coach
│   └── subscription/    # Paywall
├── src/
│   ├── components/ui/   # Button, Input, Card, Badge, etc.
│   ├── context/         # AuthContext, ThemeContext
│   ├── hooks/           # useModules, useTasks, useGrades
│   ├── lib/             # supabase.ts, theme.ts, priority-engine.ts
│   └── types/           # TypeScript types + plan limits
└── supabase/
    └── functions/
        └── ai-study-coach/   # Edge Function → Claude API
```

---

## Supabase Project Details

- **URL:** https://deyxgozlaemqsyqxlphe.supabase.co
- **Project ID:** deyxgozlaemqsyqxlphe
- **Region:** ap-south-1 (Mumbai — closest to Mauritius)
- **Dashboard:** https://app.supabase.com/project/deyxgozlaemqsyqxlphe

---

## Version Roadmap

| Version | Status | Features |
|---|---|---|
| 1.0 (MVP) | ✅ Built | Auth, Modules, Tasks, Timetable, Grades, AI, Subscriptions |
| 1.1 | Next | AI Flashcards, Quizzes, PDF upload |
| 1.2 | Planned | Budget tracker, Expenses |
| 2.0 | Future | Group Projects, shared workspaces |
| 2.5 | Future | CV Builder, Career Mode |
