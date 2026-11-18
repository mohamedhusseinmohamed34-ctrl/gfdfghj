import dotenv from "dotenv";
dotenv.config();

import jwt, { SignOptions } from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 64) {
  throw new Error("JWT_SECRET must be at least 64 characters. Generate a random secret.");
}

export function createToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"] }
  );
}

export function verifyToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid token");
  }
  return { sub: decoded.sub };
}