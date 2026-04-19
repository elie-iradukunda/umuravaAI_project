# Umurava AI Recruiter

AI-powered recruitment screening prototype for the Umurava AI Hackathon. The project is structured as a small monorepo with a Next.js recruiter dashboard, a Node.js + TypeScript API, and a shared contracts package used by both sides.

## What is already built

- Recruiter dashboard with overview metrics and job workspaces
- Multi-role homepage with tailored dashboard views for talent, recruiter, hiring manager, talent operations, and platform admin
- Job creation and editing
- Structured applicant intake
- Bulk applicant ingestion for CSV, Excel, and PDF files
- Ranked shortlist generation with transparent reasoning
- Gemini-powered screening with a deterministic mock fallback
- Gemini-assisted PDF resume extraction for richer candidate profiles
- Optional MongoDB persistence with an in-memory fallback for fast local demos
- Demo seed data so the app is usable immediately after setup

## Stack

- Frontend: Next.js, React, Redux Toolkit, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB via Mongoose, with in-memory fallback when `MONGODB_URI` is not set
- Shared package: TypeScript contracts and demo seed data
- AI layer: Gemini for resume extraction and candidate screening, with deterministic mock fallback

## Workspace structure

```text
apps/
  api/      Express API, ingestion, scoring, persistence
  web/      Next.js recruiter UI
packages/
  shared/   shared types, schemas, demo seed data
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

## Demo login accounts

- Talent: `talent@umurava.ai` / `Talent123!`
- Recruiter: `recruiter@umurava.ai` / `Recruiter123!`
- Hiring Manager: `manager@umurava.ai` / `Manager123!`
- Talent Ops: `ops@umurava.ai` / `TalentOps123!`
- Platform Admin: `admin@umurava.ai` / `Admin123!`

## Recommended demo walkthrough

1. Login as recruiter and open `/jobs/new`
2. Click `Load Demo Job Example`
3. Create the job, then stay on the job workspace
4. Switch account and login as talent
5. Open `/talent/profile`, review the structured profile rows, and save
6. Open `/talent/jobs`, pick the recruiter-created role, and apply
7. Switch back to recruiter and open the same job workspace to see the new applicant

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
- `SCREENING_PROVIDER`: `mock` or `gemini`
- `GEMINI_API_KEY`: Google Gemini API key used for CV extraction and AI screening
- `GEMINI_SCREENING_MODEL`: stable Gemini model for candidate evaluation, default `gemini-2.5-flash`
- `GEMINI_DOCUMENT_MODEL`: stable Gemini model for PDF CV extraction, default `gemini-2.5-flash`
- `AUTO_SEED_DEMO`: seeds demo job and applicants when storage is empty

### Web (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL`: backend base URL, usually `http://localhost:4000`

## Product flow

1. Recruiter creates a job and defines the role, shortlist size, and required skills.
2. Recruiter adds applicants manually or uploads CSV, Excel, and PDF files.
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

## Platform users

- Talent: creates a structured talent profile, browses active roles, and applies directly into the recruiter pipeline.
- Recruiter: creates jobs, imports applicants, runs screening, and manages shortlist preparation.
- Hiring Manager: reviews shortlist-ready roles, validates fit, and decides who moves to interviews.
- Talent Operations Lead: watches funnel health, applicant volume, and which roles need sourcing support.
- Platform Admin: monitors product readiness, ingestion coverage, screening mode, and deployment confidence.

## Architecture notes

- `apps/api/src/services/screening.service.ts` is the core provider boundary.
- `apps/api/src/services/gemini.service.ts` handles structured Gemini screening and PDF resume extraction.
- The system now supports production-style Gemini scoring with structured JSON validation and falls back to deterministic mock scoring if a Gemini call fails.
- `packages/shared` keeps job, applicant, and screening contracts consistent between the backend and frontend.

## Main API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `POST /api/jobs`
- `GET /api/jobs/:jobId`
- `PUT /api/jobs/:jobId`
- `POST /api/jobs/:jobId/applicants`
- `POST /api/jobs/:jobId/applicants/upload`
- `GET /api/jobs/:jobId/screenings`
- `POST /api/jobs/:jobId/screenings/run`

## Assumptions and current limitations

- Authentication is implemented for API-backed signup and login, but it is still prototype-level and does not yet include sessions, JWTs, or password reset flows.
- Spreadsheet mapping is flexible but still based on common column names.
- PDF CV extraction is much stronger with Gemini, but no OCR or LLM pipeline can honestly guarantee 100% perfect extraction for every scanned, blurry, rotated, or corrupted document.
- Gemini screening is evidence-based and structured, but recruiter review is still necessary before final hiring decisions.
- MongoDB becomes active only when `MONGODB_URI` is supplied.

## Verification completed

- `npm run typecheck`
- `npm run build`
