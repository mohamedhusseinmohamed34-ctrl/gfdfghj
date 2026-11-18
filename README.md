# Khidma

A booking app for a service hub in Cairo.

## Stack
- Frontend: React + Vite (to be added)
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL on Supabase
- PostgreSQL driver: pg
- Password hashing: Argon2id
- Authentication: JWT in HTTP-only cookies
- Hosting target: Vercel
- Repository: GitHub

## Backend currently implemented
- GET /api/health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/bookings (customer only)

The service discovery, service details, customer booking list, booking confirmation, provider booking/profile, admin dashboard, and About/contact endpoints are not yet implemented. See backend/README.md.

## Local setup
1. Copy backend/.env.example to backend/.env.
2. Add your Supabase PostgreSQL connection string and a generated JWT_SECRET to backend/.env.
3. From the repository root run: npm install
4. Start the backend: npm run dev
5. Test: GET http://localhost:5000/api/health

## Secrets
Never commit .env files, database credentials, JWT signing secrets, or password hashes. The committed .env.example contains placeholders only.
