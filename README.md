# ProctorLink: Secure Online Examinations with a Student-Focused Grow & Career Hub

A secure online examination platform with AI-powered proctoring features and a dedicated Grow & Career Hub for student skill development and career growth.

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Firebase (Firestore + Auth + Storage)
- **AI:** Groq (llama-3.3-70b) — fast & free
- **Vector DB:** Pinecone (optional, for Resume semantic search)

## Features

- Organizer: Create/manage exams, AI question generation, results analytics
- Student: Take exams, learning path generator, resume review, career hub
- AI: Exam questions, descriptions, learning paths, resume analysis

## Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd proctorlink
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
- `GROQ_API_KEY` — Get free at https://console.groq.com
- Firebase config is hardcoded in `src/lib/firebase.ts` (update with your project)

### 3. Firebase Setup
1. Create project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password)
3. Create **Firestore Database** (test mode)
4. Add referral code: Collection `referralCodes` → Document `ADMIN123` → field `active: true`

### 4. Run
```bash
npm run dev
# Open http://localhost:9002
```

## Deploy to Vercel

### Option 1 — Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2 — Vercel Dashboard
1. Push code to GitHub
2. Go to https://vercel.com → Import project
3. Add environment variables:
   - `GROQ_API_KEY`
   - `GOOGLE_GENAI_API_KEY` (optional)
   - `PINECONE_API_KEY` (optional)
4. Deploy!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | AI features (free at console.groq.com) |
| `GOOGLE_GENAI_API_KEY` | ❌ Optional | Backup AI |
| `PINECONE_API_KEY` | ❌ Optional | Resume semantic search |

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Organizer login |
| `/signup` | Public | Organizer signup (referral code needed) |
| `/dashboard` | Organizer | Exam management |
| `/student/login` | Public | Student login |
| `/student/signup` | Public | Student signup (free) |
| `/student/dashboard` | Student | Submissions & available exams |
| `/student/skills` | Student | Career & Growth Hub |
