import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { ContactMessage } from "../models/ContactMessage.js";

const router = Router();
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 4, standardHeaders: "draft-7", legacyHeaders: false });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", submitLimiter, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
        typeof email !== "string" || !emailPattern.test(email.trim()) || email.length > 254 ||
        typeof subject !== "string" || subject.trim().length < 2 || subject.trim().length > 100 ||
        typeof message !== "string" || message.trim().length < 5 || message.trim().length > 5000) {
      return res.status(400).json({ error: { code: "INVALID_MESSAGE", message: "Please complete each field with valid information." } });
    }

    await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });
    return res.status(201).json({ message: "Your note has been received." });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin", authenticate, requirePermission("messages:read"), async (_req, res, next) => {
  try {
    const messages = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/:id/status", authenticate, requirePermission("messages:write"), async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!["new", "read", "replied", "closed"].includes(status)) {
      return res.status(400).json({ error: { code: "INVALID_STATUS", message: "Choose a valid message status." } });
    }
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!message) return res.status(404).json({ error: { code: "MESSAGE_NOT_FOUND", message: "This message could not be found." } });
    return res.json({ message });
  } catch (error) {
    return next(error);
  }
});

export default router;