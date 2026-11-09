import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Coupon } from "../models/Coupon.js";
import { Product } from "../models/Product.js";

const router = Router();

function discountFor(coupon, subtotal) {
  if (coupon.discountType === "PERCENTAGE") {
    const amount = subtotal * coupon.discountValue / 100;
    return Math.min(amount, coupon.maxDiscount > 0 ? coupon.maxDiscount : amount, subtotal);
  }
  return Math.min(coupon.discountValue, subtotal);
}

router.post("/apply", authenticate, async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: { code: "COUPON_REQUIRED", message: "Enter a coupon code." } });
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon || coupon.expiryDate <= new Date() || (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)) {
      return res.status(400).json({ error: { code: "INVALID_COUPON", message: "This coupon is invalid or expired." } });
    }
    const cart = await Cart.findOne({ userId: req.auth.sub });
    if (!cart?.items.length) return res.status(400).json({ error: { code: "EMPTY_CART", message: "Add an item before applying a coupon." } });
    const products = await Product.find({ slug: { $in: cart.items.map((item) => item.productSlug) }, isActive: true, isArchived: false }).select("slug price").lean();
    const priceBySlug = new Map(products.map((product) => [product.slug, product.price]));
    const subtotal = cart.items.reduce((sum, item) => sum + (priceBySlug.get(item.productSlug) || 0) * item.quantity, 0);
    if (subtotal < coupon.minOrderAmount) return res.status(400).json({ error: { code: "MINIMUM_NOT_MET", message: "This coupon requires a higher order subtotal." } });
    const discount = discountFor(coupon, subtotal);
    cart.coupon = { code: coupon.code, discountAmount: discount };
    await cart.save();
    return res.json({ success: true, couponCode: coupon.code, discount, finalAmount: subtotal - discount });
  } catch (error) { return next(error); }
});

router.delete("/apply", authenticate, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.auth.sub });
    if (cart) { cart.coupon = { code: "", discountAmount: 0 }; await cart.save(); }
    return res.json({ success: true, message: "Coupon removed." });
  } catch (error) { return next(error); }
});

router.get("/admin", authenticate, requirePermission("orders:write"), async (_req, res, next) => {
  try { return res.json({ coupons: await Coupon.find({}).sort({ createdAt: -1 }).lean() }); }
  catch (error) { return next(error); }
});

router.post("/admin", authenticate, requirePermission("orders:write"), async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const discountType = req.body?.discountType;
    const discountValue = Number(req.body?.discountValue);
    const expiryDate = new Date(req.body?.expiryDate);
    const minOrderAmount = Number(req.body?.minOrderAmount || 0);
    const maxDiscount = Number(req.body?.maxDiscount || 0);
    const usageLimit = Number(req.body?.usageLimit || 0);
    if (!/^[A-Z0-9_-]{3,40}$/.test(code) || !["PERCENTAGE", "FIXED"].includes(discountType) || !Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "PERCENTAGE" && discountValue > 100) || Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date() || [minOrderAmount, maxDiscount, usageLimit].some((value) => !Number.isFinite(value) || value < 0)) {
      return res.status(400).json({ error: { code: "INVALID_COUPON", message: "Check the coupon code, discount, limits, and expiry date." } });
    }
    const coupon = await Coupon.create({ code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, expiryDate, isActive: req.body?.isActive !== false });
    return res.status(201).json({ coupon });
  } catch (error) { return next(error); }
});

router.patch("/admin/:id", authenticate, requirePermission("orders:write"), async (req, res, next) => {
  try {
    const allowed = {};
    if (typeof req.body?.isActive === "boolean") allowed.isActive = req.body.isActive;
    if (req.body?.expiryDate !== undefined) {
      const expiryDate = new Date(req.body.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) return res.status(400).json({ error: { code: "INVALID_EXPIRY", message: "Enter a valid expiry date." } });
      allowed.expiryDate = expiryDate;
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ error: { code: "COUPON_NOT_FOUND", message: "Coupon not found." } });
    return res.json({ coupon });
  } catch (error) { return next(error); }
});

export default router;
