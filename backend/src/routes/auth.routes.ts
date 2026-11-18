import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import argon2 from "argon2";
import { pool } from "../config/database";
import { createToken } from "../utils/token";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
};

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Please check your registration details",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const { full_name, email, phone, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM public.users WHERE lower(email) = $1",
      [normalizedEmail]
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const userId = randomUUID();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    await client.query(
      `INSERT INTO public.users (id, full_name, email, phone, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, full_name, normalizedEmail, phone ?? null, role]
    );
    await client.query(
      `INSERT INTO public.login_accounts (user_id, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [userId, normalizedEmail, passwordHash, role]
    );

    if (role === "customer") {
      await client.query("INSERT INTO public.customers (user_id) VALUES ($1)", [userId]);
    } else {
      await client.query("INSERT INTO public.providers (user_id) VALUES ($1)", [userId]);
    }

    await client.query("COMMIT");
    res.cookie("khidma_token", createToken(userId), cookieOptions);
    return res.status(201).json({
      message: "Registration successful",
      user: { id: userId, full_name, email: normalizedEmail, role }
    });
  } catch (error: any) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    if (error?.code === "23505") {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  } finally {
    client?.release();
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please enter a valid email and password" });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const result = await pool.query(
      `SELECT la.password_hash, u.id, u.full_name, u.email, u.role
       FROM public.login_accounts la
       JOIN public.users u ON u.id = la.user_id
       WHERE lower(la.email) = $1 AND la.role = u.role`,
      [email]
    );
    if (!result.rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const account = result.rows[0];
    const valid = await argon2.verify(account.password_hash, parsed.data.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.cookie("khidma_token", createToken(account.id), cookieOptions);
    return res.json({
      message: "Login successful",
      user: { id: account.id, full_name: account.full_name, email: account.email, role: account.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to log in. Please try again." });
  }
});

router.get("/me", authenticate, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("khidma_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  return res.json({ message: "Logged out successfully" });
});

export default router;