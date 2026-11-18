import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 64) {
  throw new Error("JWT_SECRET must be at least 64 characters");
}

export function createToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"] }
  );
}

export function verifyToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid token");
  }
  return { sub: decoded.sub };
}