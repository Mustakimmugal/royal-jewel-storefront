import { randomInt } from "node:crypto";
import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Coupon } from "../models/Coupon.js";

const router = Router();
const FREE_SHIPPING_THRESHOLD = 14500;
const STANDARD_SHIPPING_FEE = 250;

function validAddress(address) {
  if (!address || typeof address !== "object") return false;
  return ["recipient", "phone", "line1", "city", "region", "postalCode", "country"]
    .every((key) => typeof address[key] === "string" && address[key].trim().length > 0);
}

router.post("/", authenticate, async (req, res, next) => {
  const reserved = [];
  let usedCouponId = null;
  try {
    const requestedItems = req.body?.items;
    const address = req.body?.shippingAddress;
    if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 30 || !validAddress(address)) {
      return res.status(400).json({ error: { code: "INVALID_ORDER", message: "Add items and complete the delivery address." } });
    }

    const quantities = new Map();
    for (const item of requestedItems) {
      const slug = typeof item?.productId === "string" ? item.productId.trim() : "";
      const size = typeof item?.size === "string" ? item.size.trim().slice(0, 40) : "One size";
      const quantity = Number(item?.quantity);
      if (!slug || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return res.status(400).json({ error: { code: "INVALID_ORDER_ITEM", message: "One or more cart items are invalid." } });
      }
      const key = slug + "::" + size;
      quantities.set(key, { slug, size, quantity: (quantities.get(key)?.quantity || 0) + quantity });
      if (quantities.get(key).quantity > 10) {
        return res.status(400).json({ error: { code: "INVALID_ORDER_ITEM", message: "A product quantity cannot exceed ten." } });
      }
    }

    const lines = [...quantities.values()];
    const products = await Product.find({
      slug: { $in: lines.map((line) => line.slug) },
      isActive: true,
      isArchived: false,
    });
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    for (const line of lines) {
      const product = bySlug.get(line.slug);
      if (!product) {
        return res.status(409).json({ error: { code: "PRODUCT_UNAVAILABLE", message: "This item is not in the active store catalog yet. An admin must add or reactivate it before checkout." } });
      }
      if (product.sizes.length && !product.sizes.includes(line.size)) {
        return res.status(409).json({ error: { code: "INVALID_VARIANT", message: "A selected product size is no longer available." } });
      }
    }

    const orderItems = [];
    let subtotal = 0;
    for (const line of lines) {
      const product = bySlug.get(line.slug);
      const reservation = await Product.updateOne(
        { _id: product._id, isActive: true, isArchived: false, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
      );
      if (reservation.modifiedCount !== 1) {
        for (const prior of reserved) await Product.updateOne({ _id: prior.id }, { $inc: { stock: prior.quantity } });
        return res.status(409).json({ error: { code: "OUT_OF_STOCK", message: product.name + " does not have enough stock." } });
      }
      reserved.push({ id: product._id, quantity: line.quantity });
      const unitPrice = product.price;
      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;
      orderItems.push({
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        sku: product.sku,
        image: product.images[0] || "",
        size: line.size,
        quantity: line.quantity,
        unitPrice,
        lineTotal,
      });
    }

    let coupon = null;
    let discount = 0;
    const couponCode = String(req.body?.couponCode || "").trim().toUpperCase();
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon || coupon.expiryDate <= new Date() || (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)) {
        for (const item of reserved) await Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } });
        reserved.length = 0;
        return res.status(400).json({ error: { code: "INVALID_COUPON", message: "This coupon is invalid or expired." } });
      }
      if (subtotal < coupon.minOrderAmount) {
        for (const item of reserved) await Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } });
        reserved.length = 0;
        return res.status(400).json({ error: { code: "MINIMUM_NOT_MET", message: "This coupon requires a higher order subtotal." } });
      }
      discount = coupon.discountType === "PERCENTAGE"
        ? Math.min(subtotal * coupon.discountValue / 100, coupon.maxDiscount > 0 ? coupon.maxDiscount : subtotal)
        : Math.min(coupon.discountValue, subtotal);
      const couponReservationFilter = { _id: coupon._id, isActive: true, expiryDate: { $gt: new Date() } };
      if (coupon.usageLimit > 0) couponReservationFilter.usedCount = { $lt: coupon.usageLimit };
      const reservation = await Coupon.updateOne(couponReservationFilter, { $inc: { usedCount: 1 } });
      if (reservation.modifiedCount !== 1) {
        for (const item of reserved) await Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } });
        reserved.length = 0;
        return res.status(409).json({ error: { code: "COUPON_EXHAUSTED", message: "This coupon has reached its usage limit." } });
      }
      usedCouponId = coupon._id;
    }
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const order = await Order.create({
      orderNumber: "RJ" + Date.now().toString(36).toUpperCase() + randomInt(1000, 10000),
      userId: req.auth.sub,
      items: orderItems,
      shippingAddress: address,
      subtotal,
      shippingFee,
      discount,
      coupon: coupon ? { code: coupon.code, discountAmount: discount } : undefined,
      total: subtotal + shippingFee - discount,
      paymentMethod: "COD",
      paymentStatus: "pending",
      fulfillmentStatus: "pending",
      trackingHistory: [{ status: "pending" }],
    });
    return res.status(201).json({ order });
  } catch (error) {
    for (const item of reserved) await Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } }).catch(() => {});
    if (usedCouponId) await Coupon.updateOne({ _id: usedCouponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => {});
    return next(error);
  }
});

router.get("/admin", authenticate, requirePermission("orders:read"), async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "phone email displayName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/dashboard-stats", authenticate, requirePermission("orders:read"), async (_req, res, next) => {
  try {
    const [orderCounts, completedTotals, totalProducts, totalCustomers, recentOrders] = await Promise.all([
      Order.aggregate([
        { $group: { _id: "$fulfillmentStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { fulfillmentStatus: "delivered" } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
      Product.countDocuments({ isArchived: false }),
      User.countDocuments({ role: "customer", isActive: true }),
      Order.find({})
        .populate("userId", "phone email displayName")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);
    const counts = Object.fromEntries(orderCounts.map(({ _id, count }) => [_id, count]));
    return res.json({
      stats: {
        totalRevenue: completedTotals[0]?.totalRevenue || 0,
        totalOrders: Object.values(counts).reduce((sum, count) => sum + count, 0),
        totalProducts,
        totalCustomers,
        deliveredOrders: counts.delivered || 0,
        pendingOrders: counts.pending || 0,
        shippedOrders: counts.shipped || 0,
        cancelledOrders: counts.cancelled || 0,
      },
      recentOrders,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/:id/status", authenticate, requirePermission("orders:write"), async (req, res, next) => {
  try {
    const nextStatus = req.body?.fulfillmentStatus;
    const allowed = ["pending", "processing", "packed", "shipped", "delivered", "cancelled", "refund"];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ error: { code: "INVALID_STATUS", message: "Choose a valid order status." } });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "This order could not be found." } });
    const transitions = {
      pending: ["processing", "cancelled"],
      processing: ["packed", "shipped", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["pending", "processing", "packed", "shipped", "refund"],
      cancelled: [],
      refund: [],
    };
    if (!transitions[order.fulfillmentStatus]?.includes(nextStatus)) {
      return res.status(409).json({ error: { code: "INVALID_TRANSITION", message: "That order status change is not allowed." } });
    }
    if (nextStatus === "refund" && order.paymentStatus !== "paid") {
      return res.status(409).json({ error: { code: "NOT_PAID", message: "Only paid orders can be marked refunded." } });
    }
    if (nextStatus === "cancelled" && order.fulfillmentStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
      }
    }
    order.trackingHistory.push({ status: nextStatus });
    order.fulfillmentStatus = nextStatus;
    if (nextStatus === "refund") order.paymentStatus = "refunded";
    await order.save();
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});
router.patch("/admin/:id/location", authenticate, requirePermission("orders:write"), async (req, res, next) => {
  try {
    const location = req.body?.location;
    if (typeof req.body?.fulfillmentStatus !== "string") {
      return res.status(400).json({ error: { code: "INVALID_STATUS", message: "Include the current order status." } });
    }
    if (typeof location !== "string" || !location.trim() || location.trim().length > 120) {
      return res.status(400).json({ error: { code: "INVALID_LOCATION", message: "Enter a location of up to 120 characters." } });
    }
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, fulfillmentStatus: req.body.fulfillmentStatus },
      { $push: { trackingHistory: { status: req.body.fulfillmentStatus, location: location.trim(), at: new Date() } } },
      { new: true, runValidators: true },
    );
    if (!order) return res.status(409).json({ error: { code: "ORDER_CHANGED", message: "Refresh the order before adding a location." } });
    return res.json({ order });
  } catch (error) { return next(error); }
});

router.patch("/admin/:id/payment-status", authenticate, requirePermission("orders:write"), async (req, res, next) => {
  try {
    const paymentStatus = req.body?.paymentStatus;
    const paymentMethod = req.body?.paymentMethod;
    if ((paymentStatus === undefined && paymentMethod === undefined) ||
        (paymentStatus !== undefined && !["pending", "processing", "paid", "failed"].includes(paymentStatus)) ||
        (paymentMethod !== undefined && !["COD", "online", "offline"].includes(paymentMethod))) {
      return res.status(400).json({ error: { code: "INVALID_PAYMENT_STATUS", message: "Choose a valid payment method or status." } });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "This order could not be found." } });
    if (order.paymentStatus === "refunded" || ["cancelled", "refund"].includes(order.fulfillmentStatus)) {
      return res.status(409).json({ error: { code: "PAYMENT_FINAL", message: "A refunded payment cannot be changed." } });
    }
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    await order.save();
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});

router.patch("/mine/:id/cancel", authenticate, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.auth.sub });
    if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "This order could not be found." } });
    if (!["pending", "processing"].includes(order.fulfillmentStatus)) {
      return res.status(409).json({ error: { code: "ORDER_CANNOT_CANCEL", message: "This order can no longer be cancelled." } });
    }
    for (const item of order.items) await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
    order.trackingHistory.push({ status: "cancelled" });
    order.fulfillmentStatus = "cancelled";
    order.cancelledAt = new Date();
    await order.save();
    return res.json({ success: true, message: "Order cancelled.", order });
  } catch (error) { return next(error); }
});

router.post("/mine/:id/return", authenticate, async (req, res, next) => {
  try {
    const reason = String(req.body?.reason || "").trim().slice(0, 1000);
    if (!reason) return res.status(400).json({ error: { code: "RETURN_REASON_REQUIRED", message: "Tell us why you would like to return this order." } });
    const order = await Order.findOne({ _id: req.params.id, userId: req.auth.sub });
    if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "This order could not be found." } });
    if (order.fulfillmentStatus !== "delivered" || order.returnRequest?.isRequested) {
      return res.status(409).json({ error: { code: "RETURN_UNAVAILABLE", message: "A return can only be requested once for a delivered order." } });
    }
    order.returnRequest = { isRequested: true, reason, status: "pending", requestedAt: new Date(), adminNote: "" };
    await order.save();
    return res.status(201).json({ success: true, message: "Return request submitted.", order });
  } catch (error) { return next(error); }
});

router.patch("/admin/:id/return", authenticate, requirePermission("orders:write"), async (req, res, next) => {
  try {
    const status = req.body?.status;
    const adminNote = String(req.body?.adminNote || "").trim().slice(0, 1000);
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: { code: "INVALID_RETURN_STATUS", message: "Choose approved or rejected." } });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "This order could not be found." } });
    if (order.returnRequest?.status !== "pending") return res.status(409).json({ error: { code: "RETURN_ALREADY_REVIEWED", message: "This return request is no longer pending." } });
    order.returnRequest.status = status;
    order.returnRequest.adminNote = adminNote;
    if (status === "approved") {
      order.trackingHistory.push({ status: "refund" });
      order.fulfillmentStatus = "refund";
      if (order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
        order.refundStatus = "processed";
      } else {
        order.refundStatus = "manual";
      }
    }
    await order.save();
    return res.json({ success: true, message: status === "approved" && order.refundStatus === "manual" ? "Return approved. Refund must be processed manually." : "Return request updated.", order });
  } catch (error) { return next(error); }
});

router.get("/mine", authenticate, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.auth.sub })
      .select("orderNumber items shippingAddress subtotal shippingFee discount coupon total currency paymentMethod paymentStatus fulfillmentStatus returnRequest refundStatus trackingHistory createdAt cancelledAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

export default router;
