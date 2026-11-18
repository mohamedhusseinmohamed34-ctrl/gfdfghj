import { Request, Response, NextFunction } from "express";

const allowedOrigin = process.env.FRONTEND_ORIGIN;

export function originGuard(req: Request, res: Response, next: NextFunction) {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!mutating) return next();

  const origin = req.get("origin");
  if (!allowedOrigin) {
    return res.status(500).json({ message: "Server origin configuration is missing" });
  }
  if (origin && origin !== allowedOrigin) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }
  return next();
}