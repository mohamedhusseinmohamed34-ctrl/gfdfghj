import { Router, Response } from "express";
import { z } from "zod";
import { pool } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();
const profileSchema = z.object({
  business_name: z.string().trim().max(150).optional().nullable(),
  description: z.string().trim().max(3000).optional().nullable(),
  service_area: z.string().trim().max(150).optional().nullable(),
  profile_image_url: z.string().url().max(1000).optional().nullable()
});
const serviceSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(3000).optional(),
  price: z.number().min(0).max(99999999),
  price_unit: z.string().trim().min(1).max(30).default("per service"),
  image_url: z.string().url().max(1000).optional().nullable()
});

router.use(authenticate, authorize("provider"));

async function getProviderId(userId: string) {
  const r = await pool.query("SELECT id FROM public.providers WHERE user_id=$1", [userId]);
  return r.rows[0]?.id as string | undefined;
}

router.get("/bookings", async (req: AuthRequest, res: Response) => {
  try {
    const providerId = await getProviderId(req.user!.id);
    if (!providerId) return res.status(404).json({ message: "Provider profile not found" });
    const result = await pool.query(
      `SELECT b.id, b.booking_start, b.booking_end, b.address, b.notes, b.status, b.total_price,
              s.name AS service_name, cu.full_name AS customer_name, cu.phone AS customer_phone
       FROM public.bookings b
       JOIN public.services s ON s.id=b.service_id
       JOIN public.users cu ON cu.id=b.customer_id
       WHERE s.provider_id=$1
       ORDER BY b.booking_start DESC`,
      [providerId]
    );
    return res.json({ bookings: result.rows });
  } catch (error) {
    console.error("Provider bookings error:", error);
    return res.status(500).json({ message: "Unable to load provider bookings" });
  }
});

router.patch("/bookings/:id/status", async (req: AuthRequest, res: Response) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ status: z.enum(["approved", "completed", "cancelled"]) }).safeParse(req.body);
  if (!id.success || !body.success) return res.status(400).json({ message: "Invalid booking update" });

  try {
    const providerId = await getProviderId(req.user!.id);
    if (!providerId) return res.status(404).json({ message: "Provider profile not found" });

    const result = await pool.query(
      `UPDATE public.bookings b
       SET status=$1
       FROM public.services s
       WHERE b.id=$2 AND b.service_id=s.id AND s.provider_id=$3
         AND (
           ($1='approved' AND b.status='pending')
           OR ($1='completed' AND b.status='approved')
           OR ($1='cancelled' AND b.status IN ('pending','approved'))
         )
       RETURNING b.id, b.status`,
      [body.data.status, id.data, providerId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Booking not found or status change is not allowed" });
    }
    return res.json({ message: "Booking status updated", booking: result.rows[0] });
  } catch (error) {
    console.error("Update booking status error:", error);
    return res.status(500).json({ message: "Unable to update booking status" });
  }
});

router.get("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.business_name, p.description, p.service_area, p.profile_image_url, p.is_active,
              u.full_name, u.email, u.phone
       FROM public.providers p JOIN public.users u ON u.id=p.user_id
       WHERE p.user_id=$1`,
      [req.user!.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Provider profile not found" });
    return res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error("Provider profile error:", error);
    return res.status(500).json({ message: "Unable to load provider profile" });
  }
});

router.put("/profile", async (req: AuthRequest, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid profile details", errors: parsed.error.flatten().fieldErrors });
  const d = parsed.data;
  try {
    const result = await pool.query(
      `UPDATE public.providers
       SET business_name=$1, description=$2, service_area=$3, profile_image_url=$4
       WHERE user_id=$5
       RETURNING id, business_name, description, service_area, profile_image_url, is_active`,
      [d.business_name ?? null, d.description ?? null, d.service_area ?? null, d.profile_image_url ?? null, req.user!.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Provider profile not found" });
    return res.json({ message: "Profile updated", profile: result.rows[0] });
  } catch (error) {
    console.error("Update provider profile error:", error);
    return res.status(500).json({ message: "Unable to update provider profile" });
  }
});

router.get("/services", async (req: AuthRequest, res: Response) => {
  try {
    const providerId = await getProviderId(req.user!.id);
    const result = await pool.query(
      `SELECT s.id, s.name, s.description, s.price, s.price_unit, s.image_url, s.is_active,
              c.id AS category_id, c.name AS category_name
       FROM public.services s JOIN public.categories c ON c.id=s.category_id
       WHERE s.provider_id=$1 ORDER BY s.created_at DESC`,
      [providerId]
    );
    return res.json({ services: result.rows });
  } catch (error) {
    console.error("Provider services error:", error);
    return res.status(500).json({ message: "Unable to load your services" });
  }
});

router.post("/services", async (req: AuthRequest, res: Response) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid service details", errors: parsed.error.flatten().fieldErrors });
  try {
    const providerId = await getProviderId(req.user!.id);
    if (!providerId) return res.status(404).json({ message: "Provider profile not found" });
    const d = parsed.data;
    const result = await pool.query(
      `INSERT INTO public.services (provider_id,category_id,name,description,price,price_unit,image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,name,description,price,price_unit,image_url,is_active`,
      [providerId,d.category_id,d.name,d.description??null,d.price,d.price_unit,d.image_url??null]
    );
    return res.status(201).json({ message: "Service created", service: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23503") return res.status(400).json({ message: "Selected category does not exist" });
    console.error("Create service error:", error);
    return res.status(500).json({ message: "Unable to create service" });
  }
});

router.put("/services/:id", async (req: AuthRequest, res: Response) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!id.success || !parsed.success) return res.status(400).json({ message: "Invalid service update" });
  try {
    const providerId = await getProviderId(req.user!.id);
    const fields = parsed.data;
    const current = await pool.query("SELECT * FROM public.services WHERE id=$1 AND provider_id=$2",[id.data,providerId]);
    if (!current.rows.length) return res.status(404).json({ message: "Service not found" });
    const old = current.rows[0];
    const result = await pool.query(
      `UPDATE public.services SET category_id=$1,name=$2,description=$3,price=$4,price_unit=$5,image_url=$6
       WHERE id=$7 AND provider_id=$8
       RETURNING id,name,description,price,price_unit,image_url,is_active`,
      [fields.category_id??old.category_id,fields.name??old.name,fields.description??old.description,
       fields.price??Number(old.price),fields.price_unit??old.price_unit,fields.image_url===undefined?old.image_url:fields.image_url,
       id.data,providerId]
    );
    return res.json({ message: "Service updated", service: result.rows[0] });
  } catch (error) {
    console.error("Update service error:", error);
    return res.status(500).json({ message: "Unable to update service" });
  }
});


const availabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
}).refine(d => d.end_time > d.start_time, {
  message: "End time must be later than start time",
  path: ["end_time"]
});

router.get("/availability", async (req: AuthRequest, res: Response) => {
  try {
    const providerId = await getProviderId(req.user!.id);
    if (!providerId) return res.status(404).json({ message: "Provider profile not found" });
    const result = await pool.query(
      `SELECT id, day_of_week, start_time, end_time, is_available
       FROM public.provider_availability
       WHERE provider_id=$1
       ORDER BY day_of_week, start_time`,
      [providerId]
    );
    return res.json({ availability: result.rows });
  } catch (error) {
    console.error("Provider availability error:", error);
    return res.status(500).json({ message: "Unable to load availability" });
  }
});

router.post("/availability", async (req: AuthRequest, res: Response) => {
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid availability hours",
      errors: parsed.error.flatten().fieldErrors
    });
  }
  try {
    const providerId = await getProviderId(req.user!.id);
    if (!providerId) return res.status(404).json({ message: "Provider profile not found" });
    const d = parsed.data;
    const result = await pool.query(
      `INSERT INTO public.provider_availability
       (provider_id, day_of_week, start_time, end_time)
       VALUES ($1,$2,$3,$4)
       RETURNING id, day_of_week, start_time, end_time, is_available`,
      [providerId, d.day_of_week, d.start_time, d.end_time]
    );
    return res.status(201).json({ message: "Availability added", slot: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "This availability time already exists" });
    }
    console.error("Add availability error:", error);
    return res.status(500).json({ message: "Unable to add availability" });
  }
});

router.patch("/availability/:id", async (req: AuthRequest, res: Response) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ is_available: z.boolean() }).safeParse(req.body);
  if (!id.success || !body.success) {
    return res.status(400).json({ message: "Invalid availability update" });
  }
  try {
    const providerId = await getProviderId(req.user!.id);
    const result = await pool.query(
      `UPDATE public.provider_availability
       SET is_available=$1
       WHERE id=$2 AND provider_id=$3
       RETURNING id, day_of_week, start_time, end_time, is_available`,
      [body.data.is_available, id.data, providerId]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Availability slot not found" });
    return res.json({ message: "Availability updated", slot: result.rows[0] });
  } catch (error) {
    console.error("Update availability error:", error);
    return res.status(500).json({ message: "Unable to update availability" });
  }
});

router.delete("/availability/:id", async (req: AuthRequest, res: Response) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: "Invalid availability ID" });
  try {
    const providerId = await getProviderId(req.user!.id);
    const result = await pool.query(
      "DELETE FROM public.provider_availability WHERE id=$1 AND provider_id=$2 RETURNING id",
      [id.data, providerId]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Availability slot not found" });
    return res.json({ message: "Availability removed" });
  } catch (error) {
    console.error("Delete availability error:", error);
    return res.status(500).json({ message: "Unable to remove availability" });
  }
});

export default router;