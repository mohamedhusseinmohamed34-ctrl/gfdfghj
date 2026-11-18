# Khidma API

## Run locally
From the repository root:
1. Copy `backend/.env.example` to `backend/.env`.
2. Configure `DATABASE_URL` and a random `JWT_SECRET` of at least 64 characters.
3. Run `npm install` at the root.
4. Run `npm run dev:backend`.

API: http://localhost:5000

## Routes
- GET /api/health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- GET /api/categories
- GET /api/services
- GET /api/services/:id
- POST /api/bookings (customer)
- GET /api/bookings/my (customer)
- GET /api/bookings/:id (booking owner, associated provider, or admin)
- GET /api/provider/bookings (provider)
- PATCH /api/provider/bookings/:id/status (provider)
- GET/PUT /api/provider/profile (provider)
- GET/POST /api/provider/services (provider)
- PUT /api/provider/services/:id (own service only)
- GET/POST /api/provider/availability (provider)
- PATCH/DELETE /api/provider/availability/:id (provider)
- GET /api/admin/dashboard (admin/receptionist)
- PATCH /api/admin/bookings/:id/status (admin/receptionist)
- GET/POST /api/admin/categories (admin)
- GET /api/about
- POST /api/contact

## Create the first admin
1. Add these temporary values to your local `backend/.env`:
   - `ADMIN_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD` (at least 14 characters)
2. Run from the repository root: `npm run create-admin --workspace backend`.
3. The script creates a `users` and `login_accounts` record using an Argon2id hash. It refuses to promote an existing account.
4. Remove `ADMIN_PASSWORD` from the local environment file after the account is created. Never commit `.env`.

## Database
Apply `backend/sql/001_custom_login_and_page_fields.sql` only if you have not already run the equivalent custom-login update. Existing tables and data are not dropped. The base tables `users`, `providers`, `categories`, `services`, `provider_availability`, and `bookings` must exist.

## Booking behavior
Booking prices are read from the service record. The API checks the selected provider's configured working hours and rejects overlapping requests across all services offered by that provider. Providers must add weekly availability before customers can book. Availability uses PostgreSQL day-of-week convention: Sunday = 0 through Saturday = 6, and times are interpreted in Cairo local time.

## Security notes
- Passwords are Argon2id hashes only; hashes are never returned.
- JWT is stored in an HTTP-only cookie; role is reloaded from the users table on each protected request.
- Public registration accepts customer/provider only; admin is provisioned with the CLI.
- PostgreSQL credentials and JWT secrets are backend-only.
- The origin guard is basic CSRF mitigation; add a dedicated CSRF token strategy and review cross-origin cookie settings before production.
- Review Supabase database privileges and test the deployed Vercel function with your actual environment variables.
