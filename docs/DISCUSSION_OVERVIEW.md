# ProctorLink – Discussion Overview

This document explains, in plain language, what ProctorLink is, what problems it solves, who it helps, and the main ways people will use it. It complements the detailed technical documentation in the `docs/` folder.


## What is ProctorLink?
ProctorLink is a secure online examination platform that helps organizations create and deliver exams, and helps students take those exams with confidence. Beyond testing, it offers a Grow & Career Hub—an area dedicated to improving skills through recommended courses, learning paths, resume enhancement, and AI-powered mock interviews.


## Why does it matter?
- Organizers need a simple, trustworthy way to build exams, manage access, and view results.
- Students need a clear, fair experience when taking exams and a supportive place to grow their skills afterward.
- Teams benefit from one integrated platform that reduces overhead and increases student success.


## Who is it for?
- Organizers (Admins): Instructors, hiring teams, or program coordinators who design and manage exams.
- Students: People taking exams—university students, candidates in hiring assessments, learners in training programs.


## Core Capabilities (High-Level)
- Create exams: Add questions, set timers and attempts, tag topics, and optionally restrict access to specific emails.
- Manage visibility: Hide paused exams; optionally filter expired ones.
- Control access: Allow only specific emails to take a given exam when needed.
- Take exams: Students start with verification and built-in UX safeguards.
- Review results: Organizers see submissions; students review their own performance.
- Grow & Career Hub: After exams, students get guidance to improve with structured pages for Courses, Paths, Resume, Interviews, Quizzes, Question Bank, and Roadmaps.


## Primary Use Cases
1) Organizer hosts an assessment
- Create exam (manual or AI-assisted)
- Set access rules (public or allowlisted emails)
- Share the exam link and monitor results

2) Student takes an exam
- Log in and find available exams (public + permitted restricted)
- Verify details, attempt the exam within limits
- Review score and submission afterward

3) Student improves after a low score
- System identifies weak topics based on exam tags
- Student visits the Career Hub
- Explore recommended topics and future features (courses, paths, resume, interviews)


## How it works (Simple)
- You sign in (students or organizers)
- Organizers create and publish exams
- Students see only the exams they’re allowed to take (respecting restrictions and paused states)
- Results are stored for analysis and student review
- The Career Hub provides guidance for ongoing learning and job readiness


## General Information
- Technology: Next.js (frontend), Firebase Auth & Firestore (backend), and AI/Genkit for assisted content creation.
- Data: Users, Exams, and Submissions are stored in Firestore; access control is enforced by app logic and expected Firestore rules.
- Privacy & Access: Students’ personal data is minimal; exams can be public or restricted by email allowlists.
- UX: Emphasis on clarity, consistency, and quick feedback (toasts, loaders, breadcrumbs in the Career Hub).


## What’s planned next?
- Stronger role-based permissions and server-side enforcement for attempts and access
- Deeper Career Hub integrations (real course providers, resume analyzers, rich AI interviews)
- Advanced analytics for organizers and richer practice content for students


## Where to learn more
- High-level documentation: `docs/PROCTORLINK_DOCUMENTATION.md`
- SRS (requirements): `docs/SRS.md`
- Source blueprint: `docs/blueprint.md`
- Source overview: `docs/SRC_OVERVIEW.md`
- Dependency graphs: `docs/DEP_GRAPHS.md`
