# Umurava AI Recruiter

AI-powered recruitment workspace for talent, job owners, and admins. The project is structured as a small monorepo with a Next.js frontend, a Node.js + TypeScript API, and a shared contracts package used by both sides.

## What is already built

- Role-based dashboards for talent, job owners, and admins
- Job creation and editing
- API-backed signup and login for every supported role
- Structured applicant intake
- Bulk applicant ingestion for CSV, Excel, and PDF files
- Persisted talent profiles tied to the signed-in talent account
- Ranked shortlist generation with transparent reasoning
- Gemini-powered screening
- Gemini-assisted PDF resume extraction for richer candidate profiles
- Optional MongoDB persistence with an in-memory fallback for local development

## Stack

- Frontend: Next.js, React, Redux Toolkit, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB via Mongoose, with in-memory fallback when `MONGODB_URI` is not set
- Shared package: TypeScript contracts
- AI layer: Gemini for resume extraction and candidate screening

## Workspace structure

```text
apps/
  api/      Express API, ingestion, scoring, persistence
  web/      Next.js recruiter UI
packages/
  shared/   shared types and schemas
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

3. Start everything:

```bash
npm run dev
```

4. Open:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/health`

## Account access

Create accounts from `/signup` for these roles:

- Talent
- Job Owner
- Admin

## Recommended walkthrough

1. Create a job-owner account and open `/jobs/new`
2. Create a job, then stay on the job workspace
3. Create a talent account and open `/talent/profile`
4. Save the structured profile and upload a CV if needed
5. Open `/talent/jobs`, pick the created role, and apply
6. Sign back in as the job owner and open the same job workspace to see the applicant

## Scripts

- `npm run dev` starts shared watch, API, and frontend
- `npm run dev:api` starts only the backend
- `npm run dev:web` starts only the frontend
- `npm run build` builds shared, API, and frontend
- `npm run typecheck` runs TypeScript checks across the workspace

## Environment variables

### API (`apps/api/.env`)

- `PORT`: API port
- `FRONTEND_URL`: allowed frontend origin for CORS
- `MONGODB_URI`: MongoDB connection string; leave empty to use memory storage
- `SCREENING_PROVIDER`: `gemini`
- `GEMINI_API_KEY`: Google Gemini API key used for CV extraction and AI screening
- `GEMINI_SCREENING_MODEL`: stable Gemini model for candidate evaluation, default `gemini-2.5-flash`
- `GEMINI_DOCUMENT_MODEL`: stable Gemini model for PDF CV extraction, default `gemini-2.5-flash`

### Web (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL`: backend base URL, usually `http://localhost:4000`

## Product flow

1. A job owner creates a job and defines the role, shortlist size, and required skills.
2. A job owner adds applicants manually or uploads CSV, Excel, and PDF files.
3. Backend normalizes applicant data into a shared schema and uses Gemini document understanding to improve PDF CV extraction when configured.
4. Screening service scores candidates on:
   - Skills: 40%
   - Experience: 30%
   - Education: 15%
   - Relevance: 15%
5. The system returns a ranked shortlist with:
   - Match score
   - Strengths
   - Gaps
   - Recommendation

## Hackathon alignment

### Scenario 1: Screening applicants from the Umurava platform

- Talent creates a structured profile that follows the platform schema.
- Talent applies directly from the talent workspace into the job-owner pipeline.
- Job owners review applicants, trigger Gemini screening, and open ranked shortlist reasoning.

### Scenario 2: Screening applicants from external job boards

- Job owners can upload CSV, Excel, and PDF files.
- Spreadsheet ingestion normalizes common header styles such as `Full Name`, `full_name`, and `profileSummary`.
- PDF resumes are parsed into readable text, and Gemini strengthens extraction when quota and credentials are available.

### Recruiter-facing requirements covered

- Job creation and editing
- Applicant ingestion from structured forms and uploads
- AI screening trigger
- Ranked shortlist view
- Candidate-level reasoning with strengths, gaps, and recommendations

## AI decision flow

1. Recruiter creates the hiring brief with role summary, ideal-candidate notes, skills, experience, and shortlist size.
2. Applicants enter through structured talent profiles, manual recruiter entry, spreadsheet uploads, or PDF resume uploads.
3. Backend normalizes applicant data into the shared schema.
4. Gemini evaluates each candidate against the job with weighted scoring:
   - Skills: 40%
   - Experience: 30%
   - Education: 15%
   - Relevance: 15%
5. The system stores ranked shortlist results and exposes recruiter-friendly reasoning for each shortlisted candidate.

## Deployment guidance

- Frontend: Vercel is the easiest target for the Next.js app.
- Backend: Railway, Render, or Fly.io are suitable for the API.
- Database: MongoDB Atlas is recommended for persistent demo and judging environments.
- Production-style demo setup:
  - set `MONGODB_URI`
  - set `GEMINI_API_KEY`
  - set `NEXT_PUBLIC_API_BASE_URL`
  - deploy frontend and backend separately

## Seeded competition data

If you want a ready-to-demo environment with real persisted accounts, jobs, talent profiles, and applications:

```bash
npm run seed:test-data -w apps/api
```

This seeds:

- 1 admin account
- 1 job-owner account
- 5 full talent profiles
- 5 jobs
- 25 applications

Gemini screening will also run during the seed if quota and credentials are available.

## Platform users

- Talent: creates a structured talent profile, browses active roles, and applies directly into the hiring pipeline.
- Job Owner: creates jobs, imports applicants, runs screening, and manages shortlist preparation.
- Admin: monitors product readiness, ingestion coverage, screening mode, and deployment confidence.

## Architecture notes

- `apps/api/src/services/screening.service.ts` is the core provider boundary.
- `apps/api/src/services/gemini.service.ts` handles structured Gemini screening and PDF resume extraction.
- The system uses Gemini scoring with structured JSON validation for ranking and reasoning output.
- `packages/shared` keeps job, applicant, and screening contracts consistent between the backend and frontend.

## Main API endpoints

- `GET /api/health`
- `GET /api/public/jobs`
- `GET /api/public/jobs/:jobId`
- `GET /api/talent/profile`
- `PUT /api/talent/profile`
- `GET /api/talent-applications`
- `GET /api/dashboard`
- `POST /api/jobs`
- `GET /api/jobs/:jobId`
- `PUT /api/jobs/:jobId`
- `POST /api/jobs/:jobId/applicants`
- `POST /api/talent/jobs/:jobId/apply`
- `POST /api/jobs/:jobId/applicants/upload`
- `GET /api/jobs/:jobId/screenings`
- `POST /api/jobs/:jobId/screenings/run`

## Assumptions and current limitations

- Authentication is API-backed for signup and login, but it still uses a lightweight client-held session model instead of JWTs or cookie sessions.
- Spreadsheet mapping is flexible but still based on common column names.
- PDF CV extraction is much stronger with Gemini, but no OCR or LLM pipeline can honestly guarantee 100% perfect extraction for every scanned, blurry, rotated, or corrupted document.
- Gemini screening is evidence-based and structured, but recruiter review is still necessary before final hiring decisions.
- Gemini is mandatory in this project, but live screening availability still depends on the validity of `GEMINI_API_KEY` and the remaining quota on the configured Google project.
- MongoDB becomes active only when `MONGODB_URI` is supplied.

## Verification completed

- `npm run typecheck`
- `npm run build`
