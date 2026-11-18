import { Router, Response } from "express";
import { z } from "zod";
import { pool } from "../config/database";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

const createBookingSchema = z.object({
  service_id: z.string().uuid(),
  booking_start: z.string().datetime({ offset: true }),
  booking_end: z.string().datetime({ offset: true }),
  address: z.string().trim().min(5).max(1000),
  notes: z.string().trim().max(2000).optional()
}).refine(
  (data) => new Date(data.booking_end) > new Date(data.booking_start),
  {
    message: "Booking end must be after booking start",
    path: ["booking_end"]
  }
);

router.post(
  "/",
  authenticate,
  authorize("customer"),
  async (req: AuthRequest, res: Response) => {
    const parsed = createBookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid booking information",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { service_id, booking_start, booking_end, address, notes } = parsed.data;

    try {
      const serviceResult = await pool.query(
        `SELECT id, price
         FROM public.services
         WHERE id = $1 AND is_active = TRUE`,
        [service_id]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({
          message: "Service not found or unavailable"
        });
      }

      const bookingResult = await pool.query(
        `INSERT INTO public.bookings
         (customer_id, service_id, booking_start, booking_end, address, notes, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, service_id, booking_start, booking_end,
                   address, notes, status, total_price, created_at`,
        [
          req.user!.id,
          service_id,
          booking_start,
          booking_end,
          address,
          notes ?? null,
          serviceResult.rows[0].price
        ]
      );

      return res.status(201).json({
        message: "Booking request created successfully",
        booking: bookingResult.rows[0]
      });
    } catch (error) {
      console.error("Create booking error:", error);
      return res.status(500).json({
        message: "Could not create your booking. Please try again."
      });
    }
  }
);

export default router;