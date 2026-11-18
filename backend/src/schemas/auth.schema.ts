import { z } from "zod";

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(10).max(128),
  role: z.enum(["customer", "provider"])
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128)
});