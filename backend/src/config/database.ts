import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env and configure it.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});