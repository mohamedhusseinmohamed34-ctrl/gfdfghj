import dotenv from "dotenv";
dotenv.config();

import { randomUUID } from "crypto";
import argon2 from "argon2";
import { pool } from "../src/config/database";

async function main() {
  const fullName = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!fullName || fullName.length < 2 || fullName.length > 150) {
    throw new Error("Set ADMIN_NAME in backend/.env (2–150 characters).");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set a valid ADMIN_EMAIL in backend/.env.");
  }
  if (!password || password.length < 14 || password.length > 128) {
    throw new Error("Set ADMIN_PASSWORD in backend/.env (14–128 characters).");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM public.users WHERE lower(email)=$1",
      [email]
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      throw new Error("That email already exists. This script does not promote existing accounts.");
    }

    const userId = randomUUID();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    await client.query(
      "INSERT INTO public.users (id,full_name,email,role) VALUES ($1,$2,$3,'admin')",
      [userId, fullName, email]
    );
    await client.query(
      "INSERT INTO public.login_accounts (user_id,email,password_hash,role) VALUES ($1,$2,$3,'admin')",
      [userId, email, passwordHash]
    );

    await client.query("COMMIT");
    console.log("Admin account created. Sign in using the email you configured.");
    console.log("The password was stored only as an Argon2id hash.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
});
