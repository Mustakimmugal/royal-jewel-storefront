import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import contactRoutes from "./routes/contact.js";
import newsletterRoutes from "./routes/newsletter.js";
import mediaRoutes from "./routes/media.js";
import cartRoutes from "./routes/cart.js";
import couponRoutes from "./routes/coupons.js";
import addressRoutes from "./routes/addresses.js";
import wishlistRoutes from "./routes/wishlist.js";
import reviewRoutes from "./routes/reviews.js";
import customerRoutes from "./routes/customers.js";

export const app = express();
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false });

app.disable("x-powered-by");
app.use(helmet());
const allowedOrigins = new Set([config.clientOrigin]);
if (config.nodeEnv !== "production") {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://127.0.0.1:5173");
  allowedOrigins.add("http://[::1]:5173");
}
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), credentials: true }));
app.use(compression());
app.use("/api", apiLimiter);
app.use(cookieParser());
app.use("/api/products/media", express.json({ limit: "10mb" }));
app.use("/api/auth/profile/image", express.json({ limit: "10mb" }));
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => console.info(JSON.stringify({
    event: "http.request",
    method: req.method,
    path: req.path,
    status: res.statusCode,
    durationMs: Date.now() - startedAt,
  })));
  next();
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products/media", mediaRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/products", reviewRoutes);
app.use("/api/customers", customerRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "The requested resource was not found." } });
});

app.use((error, _req, res, _next) => {
  console.error(JSON.stringify({ event: "api.error", name: error.name || "Error", code: error.code || "INTERNAL_ERROR" }));
  if (error.code === 11000) {
    return res.status(409).json({ error: { code: "DUPLICATE", message: "A record with these details already exists." } });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: { code: "INVALID_INPUT", message: "Please check the submitted information." } });
  }
  return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." } });
});
