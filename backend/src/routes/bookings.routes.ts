import { Router, Response } from "express";
import { z } from "zod";
import { pool } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();
const createSchema = z.object({
  service_id: z.string().uuid(),
  booking_start: z.string().datetime({ offset: true }),
  booking_end: z.string().datetime({ offset: true }),
  address: z.string().trim().min(5).max(1000),
  notes: z.string().trim().max(2000).optional()
}).refine(d => new Date(d.booking_end) > new Date(d.booking_start), {
  message: "Booking end must be after booking start",
  path: ["booking_end"]
});

router.post("/", authenticate, authorize("customer"), async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid booking information",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const d = parsed.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const serviceResult = await client.query(
      `SELECT s.id, s.provider_id, s.price
       FROM public.services s
       JOIN public.providers p ON p.id = s.provider_id
       WHERE s.id = $1 AND s.is_active = TRUE AND p.is_active = TRUE
       FOR UPDATE OF p`,
      [d.service_id]
    );
    if (!serviceResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Service not found or unavailable" });
    }

    const service = serviceResult.rows[0];
    const availability = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM public.provider_availability pa
         WHERE pa.provider_id = $1
           AND pa.is_available = TRUE
           AND pa.day_of_week = EXTRACT(DOW FROM ($2::timestamptz AT TIME ZONE 'Africa/Cairo'))::smallint
           AND pa.start_time <= (($2::timestamptz AT TIME ZONE 'Africa/Cairo')::time)
           AND pa.end_time >= (($3::timestamptz AT TIME ZONE 'Africa/Cairo')::time)
       ) AS available,
       EXISTS (
         SELECT 1 FROM public.provider_availability pa
         WHERE pa.provider_id = $1
       ) AS has_schedule`,
      [service.provider_id, d.booking_start, d.booking_end]
    );
    if (!availability.rows[0].has_schedule || !availability.rows[0].available) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "The provider is not available at this time" });
    }

    const overlap = await client.query(
      `SELECT EXISTS (
         SELECT 1
         FROM public.bookings b
         JOIN public.services s ON s.id = b.service_id
         WHERE s.provider_id = $1
           AND b.status IN ('pending','approved')
           AND b.booking_start < $3::timestamptz
           AND b.booking_end > $2::timestamptz
       ) AS busy`,
      [service.provider_id, d.booking_start, d.booking_end]
    );
    if (overlap.rows[0].busy) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This time is already requested. Please choose another time." });
    }

    const result = await client.query(
      `INSERT INTO public.bookings
       (customer_id, service_id, booking_start, booking_end, address, notes, total_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, service_id, booking_start, booking_end, address, notes, status, total_price, created_at`,
      [req.user!.id, d.service_id, d.booking_start, d.booking_end, d.address, d.notes ?? null, service.price]
    );
    await client.query("COMMIT");
    return res.status(201).json({ message: "Booking request created successfully", booking: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Create booking error:", error);
    return res.status(500).json({ message: "Could not create your booking. Please try again." });
  } finally {
    client.release();
  }
});

router.get("/my", authenticate, authorize("customer"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.booking_start, b.booking_end, b.address, b.notes, b.status, b.total_price, b.created_at,
              s.name AS service_name, s.image_url,
              COALESCE(p.business_name, pu.full_name) AS provider_name,
              c.name AS category_name
       FROM public.bookings b
       JOIN public.services s ON s.id = b.service_id
       JOIN public.providers p ON p.id = s.provider_id
       JOIN public.users pu ON pu.id = p.user_id
       JOIN public.categories c ON c.id = s.category_id
       WHERE b.customer_id = $1
       ORDER BY b.booking_start DESC`,
      [req.user!.id]
    );
    return res.json({ bookings: result.rows });
  } catch (error) {
    console.error("My bookings error:", error);
    return res.status(500).json({ message: "Unable to load your appointments" });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid booking ID" });

  try {
    const result = await pool.query(
      `SELECT b.id, b.customer_id, b.booking_start, b.booking_end, b.address,
              b.notes, b.status, b.total_price, b.created_at,
              s.name AS service_name, s.price_unit, s.image_url,
              COALESCE(p.business_name, pu.full_name) AS provider_name,
              cu.full_name AS customer_name
       FROM public.bookings b
       JOIN public.services s ON s.id = b.service_id
       JOIN public.providers p ON p.id = s.provider_id
       JOIN public.users pu ON pu.id = p.user_id
       JOIN public.users cu ON cu.id = b.customer_id
       WHERE b.id = $1
         AND (b.customer_id = $2 OR p.user_id = $2 OR $3 = 'admin')`,
      [id.data, req.user!.id, req.user!.role]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Booking not found" });
    return res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error("Booking detail error:", error);
    return res.status(500).json({ message: "Unable to load booking details" });
  }
});

export default router;