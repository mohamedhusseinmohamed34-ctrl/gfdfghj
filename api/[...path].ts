import app from "../backend/src/app";

// Vercel sends /api/* requests to this catch-all function.
// Express then matches the original /api/... request path.
export default app;