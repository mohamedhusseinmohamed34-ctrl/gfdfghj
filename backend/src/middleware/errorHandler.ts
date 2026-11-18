import { Request, Response, NextFunction } from "express";

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ message: "An unexpected server error occurred" });
}