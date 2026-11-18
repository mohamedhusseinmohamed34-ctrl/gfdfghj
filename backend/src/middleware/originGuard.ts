import { Request, Response, NextFunction } from "express";

const allowedOrigin = process.env.FRONTEND_ORIGIN;

export function originGuard(req: Request, res: Response, next: NextFunction) {
  const methodsThatChangeData = ["POST", "PUT", "PATCH", "DELETE"];
  if (!methodsThatChangeData.includes(req.method)) return next();

  const origin = req.get("origin");

  // Non-browser clients (e.g. local API tests) may not send Origin.
  // Browser requests with an Origin must match the configured frontend.
  if (origin && allowedOrigin && origin !== allowedOrigin) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }

  return next();
}