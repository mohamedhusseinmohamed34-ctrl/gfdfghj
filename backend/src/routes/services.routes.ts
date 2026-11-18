import { Router, Response } from "express";
import { z } from "zod";
import { pool } from "../config/database";

const router = Router();
const uuidSchema = z.string().uuid();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.description, s.price, s.price_unit, s.image_url,
              c.id AS category_id, c.name AS category_name,
              p.id AS provider_id, COALESCE(p.business_name, u.full_name) AS provider_name,
              p.service_area,
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count
       FROM public.services s
       JOIN public.categories c ON c.id = s.category_id
       JOIN public.providers p ON p.id = s.provider_id
       JOIN public.users u ON u.id = p.user_id
       LEFT JOIN public.bookings b ON b.service_id = s.id
       LEFT JOIN public.reviews r ON r.booking_id = b.id
       WHERE s.is_active = TRUE AND p.is_active = TRUE
       GROUP BY s.id, c.id, p.id, u.id
       ORDER BY s.created_at DESC`
    );
    return res.json({ services: result.rows });
  } catch (error) {
    console.error("List services error:", error);
    return res.status(500).json({ message: "Unable to load services" });
  }
});

router.get("/:id", async (req, res) => {
  const parsed = uuidSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ message: "Invalid service ID" });

  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.description, s.price, s.price_unit, s.image_url,
              c.name AS category_name,
              p.id AS provider_id, p.description AS provider_description,
              p.business_name, p.service_area, p.profile_image_url,
              u.full_name AS provider_name,
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count
       FROM public.services s
       JOIN public.categories c ON c.id = s.category_id
       JOIN public.providers p ON p.id = s.provider_id
       JOIN public.users u ON u.id = p.user_id
       LEFT JOIN public.bookings b ON b.service_id = s.id
       LEFT JOIN public.reviews r ON r.booking_id = b.id
       WHERE s.id = $1 AND s.is_active = TRUE AND p.is_active = TRUE
       GROUP BY s.id, c.id, p.id, u.id`,
      [parsed.data]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Service not found" });

    const availability = await pool.query(
      `SELECT day_of_week, start_time, end_time
       FROM public.provider_availability
       WHERE provider_id = $1 AND is_available = TRUE
       ORDER BY day_of_week, start_time`,
      [result.rows[0].provider_id]
    );
    return res.json({ service: result.rows[0], availability: availability.rows });
  } catch (error) {
    console.error("Service detail error:", error);
    return res.status(500).json({ message: "Unable to load service details" });
  }
});

export default router;