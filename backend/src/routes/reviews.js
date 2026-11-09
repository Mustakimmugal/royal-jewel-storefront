import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ProductReview } from "../models/ProductReview.js";
import { User } from "../models/User.js";

const router = Router({ mergeParams: true });

router.get("/:slug/reviews", async (req, res, next) => {
  try {
    const reviews = await ProductReview.find({ productSlug: req.params.slug }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ reviews });
  } catch (error) { return next(error); }
});

router.post("/:slug/reviews", authenticate, async (req, res, next) => {
  try {
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment || comment.length > 2000) {
      return res.status(400).json({ error: { code: "INVALID_REVIEW", message: "Add a rating from one to five and a comment up to 2,000 characters." } });
    }
    const product = await Product.findOne({ slug: req.params.slug, isActive: true, isArchived: false });
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product is not available." } });
    const user = await User.findById(req.auth.sub).select("displayName").lean();
    const purchase = await Order.exists({ userId: req.auth.sub, fulfillmentStatus: "delivered", "items.productSlug": req.params.slug });
    const review = await ProductReview.findOneAndUpdate(
      { productSlug: req.params.slug, userId: req.auth.sub },
      { $set: { rating, comment, userName: user?.displayName || "Royal Jewellers customer", isVerifiedPurchase: Boolean(purchase) } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    const summary = await ProductReview.aggregate([
      { $match: { productSlug: req.params.slug } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Product.updateOne({ _id: product._id }, { $set: { rating: summary[0]?.average || 0, reviews: summary[0]?.count || 0 } });
    return res.status(201).json({ success: true, review, rating: summary[0]?.average || 0, reviews: summary[0]?.count || 0 });
  } catch (error) { return next(error); }
});

export default router;
