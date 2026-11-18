import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/database";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();
router.use(authenticate, authorize("admin"));

router.get("/dashboard", async (_req, res) => {
  try {
    const [users, providers, services, bookings, recent] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM public.users"),
      pool.query("SELECT COUNT(*)::int AS count FROM public.providers WHERE is_active=TRUE"),
      pool.query("SELECT COUNT(*)::int AS count FROM public.services WHERE is_active=TRUE"),
      pool.query("SELECT status, COUNT(*)::int AS count FROM public.bookings GROUP BY status"),
      pool.query(
        `SELECT b.id,b.booking_start,b.status,b.total_price,
                cu.full_name AS customer_name,s.name AS service_name,
                COALESCE(p.business_name,pu.full_name) AS provider_name
         FROM public.bookings b
         JOIN public.users cu ON cu.id=b.customer_id
         JOIN public.services s ON s.id=b.service_id
         JOIN public.providers p ON p.id=s.provider_id
         JOIN public.users pu ON pu.id=p.user_id
         ORDER BY b.created_at DESC LIMIT 10`
      )
    ]);
    return res.json({
      stats: {
        total_users: users.rows[0].count,
        active_providers: providers.rows[0].count,
        active_services: services.rows[0].count,
        bookings_by_status: bookings.rows
      },
      recent_bookings: recent.rows
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ message: "Unable to load admin dashboard" });
  }
});


// Receptionist/admin booking status updates.
router.patch("/bookings/:id/status", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  const body = z.object({ status: z.enum(["approved", "completed", "cancelled"]) }).safeParse(req.body);
  if (!id.success || !body.success) {
    return res.status(400).json({ message: "Invalid booking update" });
  }
  try {
    const result = await pool.query(
      `UPDATE public.bookings
       SET status = $1
       WHERE id = $2
         AND (
           ($1 = 'approved' AND status = 'pending')
           OR ($1 = 'completed' AND status = 'approved')
           OR ($1 = 'cancelled' AND status IN ('pending','approved'))
         )
       RETURNING id, status`,
      [body.data.status, id.data]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Booking not found or status change is not allowed" });
    }
    return res.json({ message: "Booking status updated", booking: result.rows[0] });
  } catch (error) {
    console.error("Admin booking update error:", error);
    return res.status(500).json({ message: "Unable to update booking status" });
  }
});

export default router;