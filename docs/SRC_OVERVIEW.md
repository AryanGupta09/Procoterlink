# Source Overview (src/)

This document provides a file-by-file overview of the `src/` codebase, explaining responsibilities, important imports/exports, and notable dependencies. Use this alongside `docs/blueprint.md` for architectural guidance.


## Directory Map
```
src/
  ai/
    dev.ts
    genkit.ts
    flows/
      generate-exam-description.ts
      generate-exam-questions.ts
  app/
    dashboard/
      create/page.tsx
      edit/[id]/page.tsx
      results/page.tsx
      layout.tsx
      page.tsx
    exam/[id]/
      page.tsx
      verify/page.tsx
      take/page.tsx
    student/
      dashboard/
        submission/[id]/page.tsx
        layout.tsx
        page.tsx
      profile/page.tsx
      skills/
        layout.tsx
        page.tsx
        courses/page.tsx
        path/page.tsx
        resume/page.tsx
        interview/page.tsx
        quiz/page.tsx
        questions/page.tsx
        roadmap/page.tsx
    legal/
      privacy/page.tsx
      terms/page.tsx
    login/page.tsx
    signup/page.tsx
    layout.tsx
    page.tsx
  components/ui/
    ... shadcn-based primitives (button, card, input, dialog, etc.)
  context/
    AuthContext.tsx
  hooks/
    use-toast.ts
    use-mobile.tsx
  lib/
    firebase.ts
    rbac.tsx
    utils.ts
```


## Key Dependency Graph
```mermaid
flowchart TD
  subgraph UI[components/ui/*]
  end

  subgraph LIB[lib/*]
    L1[firebase.ts]
    L2[utils.ts]
    L3[rbac.tsx]
  end

  subgraph CORE
    C1[context/AuthContext]
    C2[hooks/use-toast]
  end

  subgraph PAGES[app/*]
    P1[dashboard/*]
    P2[exam/[id]/*]
    P3[student/dashboard/*]
    P4[student/profile]
    P5[student/skills/*]
  end

  PAGES --> UI
  PAGES --> LIB
  PAGES --> CORE
  CORE --> LIB
```


## ai/
- `genkit.ts`: Initializes and configures Genkit/AI providers for use in flows.
- `dev.ts`: Helper for local AI development or debug usage.
- `flows/generate-exam-questions.ts`: Exports an async function that takes `{ topic, difficulty, numberOfQuestions }` and returns a question set. Consumed in `dashboard/create/page.tsx`.
- `flows/generate-exam-description.ts`: Exports an async function that takes `{ topic }` and returns a descriptive paragraph. Consumed in `dashboard/create/page.tsx`.


## app/
Global routing via Next.js App Router.

### app/layout.tsx
- Root layout for the app (global styles, providers if any).

### app/page.tsx
- Public landing page with marketing content and CTAs for student and organizer logins.

### app/login/page.tsx, app/signup/page.tsx
- Authentication screens for organizers (and generic users).

### app/legal/
- `privacy/page.tsx`, `terms/page.tsx` – Static policy pages.

### app/dashboard/
- `page.tsx`: Organizer dashboard – lists exams via Firestore (`collection('exams')`, `orderBy('createdAt')`). Shows participants count using submission counts.
- `layout.tsx`: Dashboard shell (navigation, etc.).
- `create/page.tsx`: Exam builder with AI question/description generation. Saves exams with fields like `tags`, `questions`, `perQuestionTimer`, `allowedAttempts`, `expiryDate`, `restrictToEmails`, `allowedEmails`, `createdAt`.
- `edit/[id]/page.tsx`: Edit existing exam (structure similar to create with load + update).
- `results/page.tsx`: Fetch and filter submissions for a given exam (sorts, filters, displays metrics).

### app/exam/[id]/
- `page.tsx` (Exam Details/Start):
  - Loads `exams/{id}`; checks `isPaused` and `expiryDate`.
  - Restriction check if `restrictToEmails` is true.
  - Attempts check via `getCountFromServer` for (examId, participantEmail).
  - Autofills student details from `users/{uid}`.
  - Stores participant info in localStorage and navigates to verify.
- `verify/page.tsx`: Intermediate step to confirm details/proctoring notices.
- `take/page.tsx`: Exam-taking UI; enforces UX-level constraints (no copy/paste, etc.).

### app/student/dashboard/
- `page.tsx`: Lists student’s submissions via `where('participantEmail','==', user.email)`. Shows stats and an Available Exams section:
  - Public exams: `restrictToEmails == false`
  - Restricted exams: `allowedEmails` contains `user.email`
  - Excludes paused exams.
- `layout.tsx`: Shell for student dashboard area.
- `submission/[id]/page.tsx`: Shows details for a specific submission.

### app/student/profile/page.tsx
- Loads and updates `users/{uid}` document (read-only email). Fields: `fullName`, `college`, `graduationYear`.

### app/student/skills/
- `layout.tsx`: Reusable Career Hub layout (sticky header with logo, breadcrumbs, footer).
- `page.tsx` (Hub Landing):
  - Dynamic recommendations: queries student submissions; for those with score < 60%, fetches related exam tags; aggregates and displays suggested topics.
  - Cards linking to subpages.
- Subpages (`courses`, `path`, `resume`, `interview`, `quiz`, `questions`, `roadmap`): Placeholder content describing future capabilities.


## components/ui/
- Design system wrappers: `button.tsx`, `card.tsx`, `input.tsx`, `dialog.tsx`, `select.tsx`, etc.
- These components should contain minimal logic and be reusable across routes.


## context/
- `AuthContext.tsx`: Exposes `user` (Firebase Auth) to client-components. Consumed by student pages to personalize content and restrict actions.


## hooks/
- `use-toast.ts`: Toast management hook; used for success/error notifications.
- `use-mobile.tsx`: Utility to detect mobile layouts in components.


## lib/
- `firebase.ts`: Initializes and exports `db`, `auth` (as applicable) using environment variables.
- `rbac.tsx`: Role-based helpers (placeholder for future custom claims logic).
- `utils.ts`: Shared helpers (e.g., `cn`, formatters).


## Cross-Cutting Concerns
- Error Handling: Pages use `useToast` to report errors. Console logs remain for developer debugging.
- Performance: Avoid composite indexes unless necessary; split queries to reduce index requirements. Use skeleton loaders.
- Security: Implement Firestore rules (see docs) for user data, submissions, and exam write permissions.


## Quick Navigation Index
- Organizer
  - Dashboard: `src/app/dashboard/page.tsx`
  - Create Exam: `src/app/dashboard/create/page.tsx`
  - Edit Exam: `src/app/dashboard/edit/[id]/page.tsx`
  - Results: `src/app/dashboard/results/page.tsx`
- Exams
  - Details/Start: `src/app/exam/[id]/page.tsx`
  - Verify: `src/app/exam/[id]/verify/page.tsx`
  - Take: `src/app/exam/[id]/take/page.tsx`
- Student
  - Dashboard: `src/app/student/dashboard/page.tsx`
  - Submission Details: `src/app/student/dashboard/submission/[id]/page.tsx`
  - Profile: `src/app/student/profile/page.tsx`
  - Career Hub (Landing): `src/app/student/skills/page.tsx`
  - Career Hub (Layout): `src/app/student/skills/layout.tsx`
  - Courses: `src/app/student/skills/courses/page.tsx`
  - Learning Path: `src/app/student/skills/path/page.tsx`
  - Resume: `src/app/student/skills/resume/page.tsx`
  - AI Interviews: `src/app/student/skills/interview/page.tsx`
  - Practice Quizzes: `src/app/student/skills/quiz/page.tsx`
  - Question Bank: `src/app/student/skills/questions/page.tsx`
  - Roadmaps: `src/app/student/skills/roadmap/page.tsx`


---
Keep this overview aligned with code changes. For a deeper architecture view, see `docs/blueprint.md` and `docs/PROCTORLINK_DOCUMENTATION.md`. 
