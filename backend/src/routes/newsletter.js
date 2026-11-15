import { Router } from "express";
import rateLimit from "express-rate-limit";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber.js";

const router = Router();
const subscribeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 4, standardHeaders: "draft-7", legacyHeaders: false });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", subscribeLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !emailPattern.test(email)) {
      return res.status(400).json({ error: { code: "INVALID_EMAIL", message: "Enter a valid email address." } });
    }
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { $set: { status: "active", subscribedAt: new Date() }, $setOnInsert: { email } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return res.status(201).json({ message: "You are on the MH JEWELLERS list." });
  } catch (error) {
    return next(error);
  }
});

export default router;