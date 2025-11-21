# collab-engine

An app that helps builders find collaborators for side projects, hackathons, and startups.

## MVP Scope

The first version will do just a few things well:

- User sign up / log in with auth (Clerk)
- Simple profile with:
  - Skills
  - Interests
  - Availability
- Basic project posting:
  - Title, description, tags, required skills
- Matching:
  - Show a list of potential collaborators or projects based on skills/tags
- Simple messaging or contact (even a "share contact" button is fine for MVP)

## Tech Stack

- **Frontend**: Next.js (React, TypeScript)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: Clerk (or similar hosted auth provider)
- **Deployment** (later):
  - Frontend: Vercel or similar
  - Backend: Render/Fly.io/Heroku-style service
  - Database: Hosted Postgres (e.g. Supabase, Neon, Railway, etc.)

## Project Structure

- `frontend/` — Next.js app (UI, pages, components)
- `backend/` — Express API (REST endpoints, database access)
- `.github/workflows/` — CI/CD workflows (tests, linting, deploy pipelines)
