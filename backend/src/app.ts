import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/bookings.routes";
import { originGuard } from "./middleware/originGuard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(originGuard);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    message: "Too many authentication attempts. Try again later."
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ message: "Khidma API is running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use(errorHandler);

export default app;