import { Request, Response, NextFunction } from "express";
import { pool } from "../config/database";
import { verifyToken } from "../utils/token";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: "customer" | "provider" | "admin";
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.khidma_token;

  if (!token) {
    return res.status(401).json({ message: "Please log in first" });
  }

  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please log in again."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User account not found" });
    }

    req.user = result.rows[0];
    return next();
  } catch (error) {
    console.error("Authentication database error:", error);
    return res.status(500).json({ message: "Unable to verify your session" });
  }
}