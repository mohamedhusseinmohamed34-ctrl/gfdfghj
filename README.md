# Khidma — Cairo Service Hub

A booking application for a service hub in Cairo. Customers discover services and book appointments; providers manage their services and bookings; administrators/receptionists manage the platform.

## Stack
- React + Vite frontend
- Node.js + Express + TypeScript backend
- PostgreSQL hosted on Supabase
- `pg` database driver
- Argon2id password hashing
- JWT in HTTP-only cookies (custom authentication; not Supabase Auth)
- Zod validation
- Vercel deployment

## Structure
- `frontend/` React application
- `backend/` Express API and database code
- `vercel.json` Vercel Services routing configuration
- `backend/sql/` custom-login migration

## Setup
1. Run the SQL migration in `backend/sql/001_custom_login_and_page_fields.sql` only if you have not already applied the equivalent update.
2. Copy `backend/.env.example` to `backend/.env`.
3. Add your Supabase PostgreSQL connection string and a random JWT secret (at least 64 characters) to `backend/.env`.
4. From the root run `npm install`, then `npm run dev`.

To provision the first admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` temporarily in `backend/.env` (use a unique password of at least 14 characters), then run `npm run create-admin --workspace backend`. Remove `ADMIN_PASSWORD` from the local environment file after the account is created. Existing accounts are never promoted by this script.
5. Frontend: http://localhost:5173 — API: http://localhost:5000/api/health


## Deploy both apps together on Vercel

This repository uses Vercel Services to build two apps separately and serve them through one deployment:
- `frontend/` is the Vite website.
- `backend/` is the Express API.

In Vercel, import this repository and configure the project:
1. Set **Root Directory** to the repository root (`.`), not `frontend` or `backend`.
2. Set **Framework Preset** to **Services** (not Vite or Express).
3. Keep the committed root `vercel.json`. It routes `/api/*` to the backend and all other paths to the frontend.
4. Add these Environment Variables for the required environments: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, and `FRONTEND_ORIGIN` set to the exact deployed origin (for example, `https://your-project.vercel.app`). Never prefix backend secrets with `VITE_`.
5. Redeploy.

The backend exports its Express app from `backend/src/app.ts`, an entry file recognized by Vercel's Express framework. The frontend has its own Vite project configuration under `frontend/`.

**Important:** Vercel Services is currently a beta deployment mode. If the **Services** Framework Preset is not available in your Vercel project, this two-service single-project configuration is not enabled for your account. In that case, deploy `frontend/` and `backend/` as separate Vercel projects instead.

## Implemented pages
Welcome/login/register, home/service discovery, service details, book appointment, booking confirmation, my appointments, provider bookings, provider profile, admin dashboard, receptionist dashboard, About/contact.

## Roles
Public registration supports customer and provider only. Admin/receptionist routes require the admin role because the supplied database schema only allows customer/provider/admin. Do not expose admin registration from the public interface; provision admin accounts through a trusted server-side process.

## Implemented APIs
Authentication: register, login, current user, logout.
Services: list and detail.
Bookings: create, customer list, booking detail.
Provider: list own bookings, update booking status, read/update profile, list/create/update services.
Admin: dashboard counts and recent bookings.
General: About information and contact submissions.

## Security notes
- Passwords are stored only as Argon2id hashes. Hashes are never returned.
- Secrets belong in backend environment variables / Vercel environment variables, never in React variables.
- The React app never connects directly to PostgreSQL.
- The booking endpoint validates input, derives its price from the database and checks service availability.
- Before production, test appointment overlap and provider schedule enforcement, review database privileges/RLS, add CSRF token protection and contact spam controls, and set up monitoring/backups.
- Use Supabase's recommended pooled PostgreSQL connection for serverless deployments.
