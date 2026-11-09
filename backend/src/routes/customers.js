import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/admin", authenticate, requirePermission("orders:read"), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const [customers, total] = await Promise.all([
      User.find({ role: "customer" })
        .select("displayName email phone isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "customer" }),
    ]);
    return res.json({ customers, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
});

export default router;
