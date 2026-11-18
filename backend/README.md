# Khidma backend

## Stack
Node.js + Express + TypeScript, PostgreSQL on Supabase, pg, Argon2id, JWT in HTTP-only cookies.

## Implemented endpoints
- GET /api/health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/bookings (customer only)

Service discovery, provider pages, admin dashboard, and contact routes are not implemented in this first commit.

## Database prerequisites
Apply the custom-login SQL update before registering accounts. It must create public.login_accounts and public.customers and remove the foreign key from public.users.id to auth.users.id. Existing public.users, providers, services, and bookings tables are also required.

## Local setup
1. Copy .env.example to .env inside this folder.
2. Add your Supabase PostgreSQL DATABASE_URL.
3. Generate a random JWT_SECRET of at least 64 characters.
4. Run npm install, then npm run dev.
5. Test GET http://localhost:5000/api/health.

## Security notes
- Never commit .env or real credentials.
- Passwords are stored as Argon2id hashes only; hashes are never returned by API routes.
- Public registration permits customer and provider only.
- Admin accounts must be created through a trusted administrative process.
- Use PostgreSQL credentials only in the backend, never in Vite client variables.
- The origin guard is a basic browser-origin check, not a complete CSRF token implementation. Add robust CSRF protection before production.
- Add provider booking ownership checks and appointment availability/overlap checks before production.
- Review Supabase database permissions and use a restricted database role where practical.
- Configure Supabase's recommended pooled connection and certificate settings for Vercel serverless functions.

## Vercel
Configure DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV, and FRONTEND_ORIGIN as Vercel environment variables. The API entry point is /api/index.ts. Verify the Vercel project root/build configuration for your monorepo before deployment.
