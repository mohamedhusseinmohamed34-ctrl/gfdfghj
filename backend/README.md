# Khidma API

## Run locally
From the repository root:
1. Copy `backend/.env.example` to `backend/.env`.
2. Configure `DATABASE_URL` and a random `JWT_SECRET` (64+ characters).
3. Run `npm install`.
4. Run `npm run dev:backend`.

API is served at http://localhost:5000.

## Routes
- GET /api/health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
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
- GET /api/admin/dashboard (admin)
- GET /api/about
- POST /api/contact

The application uses custom account storage, Argon2id hashes, and JWT cookies. It does not use Supabase Auth.

## Notes
The API derives booking prices from the services table and validates dates and provider schedule records where a schedule exists. A real booking platform should enforce slot conflicts at the database level as well as in application code. The supplied schema stores provider availability as weekly windows and does not yet represent holidays or exceptions.
