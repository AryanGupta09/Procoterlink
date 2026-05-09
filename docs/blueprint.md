# ProctorLink Source Blueprint

This blueprint describes the `src/` architecture: directories, responsibilities, routing, key flows, dependency rules, conventions, and extension points. Use it as a practical guide while working in this codebase.


## 1) Top-Level Layout (src/)
```
src/
  ai/                  # AI/Genkit flows and helpers
  app/                 # Next.js App Router pages and layouts
  components/ui/       # Reusable UI primitives (shadcn/ui-based)
  context/             # React contexts (e.g., AuthContext)
  hooks/               # Reusable React hooks (toast, responsive)
  lib/                 # Client libraries (firebase, rbac, utils)
```


## 2) Routing Blueprint (Next.js App Router)
- Public:
  - `/` → Landing page (product marketing, CTA)
  - `/legal/terms` | `/legal/privacy` → Policy pages
- Organizer/Admin:
  - `/dashboard` → Exams listing/overview
  - `/dashboard/create` → Create a new exam
  - `/dashboard/edit/[id]` → Edit existing exam
  - `/dashboard/results` → Results exploration
- Exams (student-accessible by deep link):
  - `/exam/[id]` → Exam details/start (restriction, attempts, paused/expiry checks)
  - `/exam/[id]/verify` → Verification step
  - `/exam/[id]/take` → Taking the exam (UI/UX constraints)
- Student:
  - `/student/dashboard` → Student home: submissions list + stats
  - `/student/dashboard/submission/[id]` → Submission detail (student)
  - `/student/profile` → Profile (fullName, college, graduationYear)
  - `/student/skills` → Grow & Career Hub (shared layout, breadcrumbs, footer)
    - `/student/skills/courses` → Recommended Courses (dynamic + defaults)
    - `/student/skills/path` → Learning Path Generator
    - `/student/skills/resume` → Resume Improvement
    - `/student/skills/interview` → AI Mock Interviews
    - `/student/skills/quiz` → Practice Quizzes
    - `/student/skills/questions` → Interview Question Bank
    - `/student/skills/roadmap` → Career Roadmaps


## 3) Module Responsibilities
- `ai/`
  - `flows/generate-exam-questions.ts`: AI generation of MCQs based on topic/difficulty/quantity.
  - `flows/generate-exam-description.ts`: AI summary/description for an exam topic.
  - `genkit.ts`, `dev.ts`: Genkit configuration/bootstrap.

- `app/`
  - Page-level components and route-specific logic (fetching, page composition).
  - Co-located `layout.tsx` files define per-route shells and shared UI (e.g., Career Hub layout).

- `components/ui/`
  - Reusable UI primitives: `button`, `card`, `input`, `dialog`, `select`, etc.
  - Avoid business logic; keep them generic.

- `context/`
  - `AuthContext.tsx`: Provides Firebase user to client components.

- `hooks/`
  - `use-toast.ts`: Toast/notifications.
  - `use-mobile.tsx`: Responsive helper.

- `lib/`
  - `firebase.ts`: Firebase initialization from env vars.
  - `rbac.tsx`: Role helpers (placeholder for future custom claims).
  - `utils.ts`: Shared client helpers (formatting, cn, etc.).


## 4) Data Flow & Firestore Access
- No custom server: client talks directly to Firebase.
- Firestore collections: `users`, `exams`, `submissions`.
- Read/write patterns:
  - Exams: `addDoc`, `getDoc`, `getDocs`, `query`, `where`, `orderBy`.
  - Submissions: `addDoc`, `getDocs`, `getCountFromServer` for attempts.
  - Users: `getDoc`, `updateDoc`.

Key flows:
- Available exams (student):
  - Public exams (`restrictToEmails == false`) + Restricted exams (`restrictToEmails == true` AND `allowedEmails` contains `student.email`).
  - Exclude paused exams (`isPaused` true). Optionally filter expired.
- Start exam:
  - Validate paused/expired; restricted email allowlist; attempt count.
- Career Hub recommendations:
  - Aggregate tags from student submissions with score < 60%; display top topics.


## 5) Coding Conventions & Patterns
- TypeScript: Prefer explicit types for public interfaces and complex data.
- Naming:
  - Variables: descriptive nouns (`allowedEmailsList`, `recommendedTags`).
  - Functions: verb phrases (`fetchAvailableExams`, `startExam`).
- React:
  - Client-only where necessary; keep components focused and readable.
  - Use early returns to reduce nesting.
- Error handling:
  - Use toast notifications; log to console for debugging; avoid silent catches.
- UI:
  - Keep consistent padding/spacing; favor readability over density.
  - Use `components/ui` primitives; avoid one-off styling unless necessary.


## 6) Dependency Rules
- UI primitives in `components/ui/` have no business logic; higher layers compose them.
- `app/*` may import from `components/ui`, `context`, `hooks`, and `lib`.
- `ai/*` should be side-effect free except when calling configured providers.
- Avoid circular imports across layers.


## 7) Extension Points
- Exams:
  - Add question types (coding, essay) by extending `questions` schema and take UI.
  - Add server functions to enforce attempts, access control, and auditing.
- Career Hub:
  - Replace placeholders with real integrations (course providers, resume parsers, mock interview engines).
  - Enhance recommender: weight recency, personalize difficulty, and add content mapping.
- Auth & RBAC:
  - Introduce custom claims; add role-based middleware and Firestore security rules.
- Analytics:
  - Add cohort analytics, topic mastery charts, and organizer dashboards.


## 8) Quality & Performance
- Avoid composite indexes where not required; split queries if needed.
- Limit recommendation aggregation to recent N submissions for performance; cache results client-side.
- Use skeleton loaders for perceived performance.


## 9) Security Notes
- Firestore Rules (to define in Firebase console):
  - Users can read/update their own `users/{uid}`.
  - Submissions readable by the participant and admin; writable by authenticated participants.
  - Exams readable publicly (or partition sensitive fields) and writable by admins.
- Do not expose secrets in client; store public Firebase config only.


## 10) Testing Guidelines
- Unit tests for utility functions.
- Integration tests with Firestore emulator where feasible.
- E2E happy paths: create exam → take exam → results → Career Hub.


## 11) Deployment & Ops
- Build with `npm run build`, serve with `npm run start`.
- Host on Vercel/Firebase Hosting; ensure `.env` is configured.
- Monitor Firestore usage and indexes; adjust as scale grows.


## 12) Route-to-File Map (selected)
```
/                                 -> src/app/page.tsx
/login                            -> src/app/login/page.tsx
/signup                           -> src/app/signup/page.tsx
/dashboard                        -> src/app/dashboard/page.tsx
/dashboard/create                 -> src/app/dashboard/create/page.tsx
/dashboard/edit/[id]              -> src/app/dashboard/edit/[id]/page.tsx
/dashboard/results                -> src/app/dashboard/results/page.tsx
/exam/[id]                        -> src/app/exam/[id]/page.tsx
/exam/[id]/verify                 -> src/app/exam/[id]/verify/page.tsx
/exam/[id]/take                   -> src/app/exam/[id]/take/page.tsx
/student/dashboard                -> src/app/student/dashboard/page.tsx
/student/dashboard/submission/[id]-> src/app/student/dashboard/submission/[id]/page.tsx
/student/profile                  -> src/app/student/profile/page.tsx
/student/skills                   -> src/app/student/skills/page.tsx
/student/skills/courses           -> src/app/student/skills/courses/page.tsx
/student/skills/path              -> src/app/student/skills/path/page.tsx
/student/skills/resume            -> src/app/student/skills/resume/page.tsx
/student/skills/interview         -> src/app/student/skills/interview/page.tsx
/student/skills/quiz              -> src/app/student/skills/quiz/page.tsx
/student/skills/questions         -> src/app/student/skills/questions/page.tsx
/student/skills/roadmap           -> src/app/student/skills/roadmap/page.tsx
```


## 13) Future Work Checklist
- [ ] Custom claims + RBAC
- [ ] Server-enforced attempts + access control (Cloud Functions)
- [ ] Real course/provider integrations and content mapping
- [ ] AI mock interview with audio/video and feedback transcripts
- [ ] Topic mastery analytics and organizer dashboards

---
This blueprint complements `docs/PROCTORLINK_DOCUMENTATION.md` and `docs/SRS.md`. Keep it updated alongside code changes.