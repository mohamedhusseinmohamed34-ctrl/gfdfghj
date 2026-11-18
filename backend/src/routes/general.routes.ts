import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/database";

const router = Router();

router.get("/about", (_req, res) => {
  return res.json({
    name: "Khidma",
    description: "A Cairo service hub that helps people discover and book everyday local services.",
    how_it_works: [
      "Browse services and compare provider details.",
      "Choose a suitable date and time.",
      "Send a booking request and track its status."
    ]
  });
});

const contactSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(5).max(4000)
});

router.post("/contact", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check your contact details", errors: parsed.error.flatten().fieldErrors });

  try {
    const d = parsed.data;
    await pool.query(
      `INSERT INTO public.contact_messages (full_name,email,phone,message)
       VALUES ($1,$2,$3,$4)`,
      [d.full_name,d.email.toLowerCase(),d.phone??null,d.message]
    );
    return res.status(201).json({ message: "Your message has been sent. Thank you." });
  } catch (error) {
    console.error("Contact submission error:", error);
    return res.status(500).json({ message: "Unable to send your message right now" });
  }
});

export default router;