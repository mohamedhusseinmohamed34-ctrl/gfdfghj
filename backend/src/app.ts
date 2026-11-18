import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import serviceRoutes from "./routes/services.routes";
import categoryRoutes from "./routes/categories.routes";
import bookingRoutes from "./routes/bookings.routes";
import providerRoutes from "./routes/provider.routes";
import adminRoutes from "./routes/admin.routes";
import generalRoutes from "./routes/general.routes";
import { originGuard } from "./middleware/originGuard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "25kb" }));
app.use(cookieParser());
app.use(originGuard);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." }
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages. Please try again later." }
});

app.get("/api/health", (_req,res) => res.json({ message: "Khidma API is running" }));
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactLimiter);
app.use("/api", generalRoutes);
app.use(errorHandler);

export default app;
