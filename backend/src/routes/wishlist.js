import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("wishlist").lean();
    const products = await Product.find({ slug: { $in: user?.wishlist || [] }, isActive: true, isArchived: false }).lean();
    return res.json({ wishlist: user?.wishlist || [], products });
  } catch (error) { return next(error); }
});

router.put("/", authenticate, async (req, res, next) => {
  try {
    const requested = req.body?.wishlist;
    if (!Array.isArray(requested) || requested.length > 200) return res.status(400).json({ error: { code: "INVALID_WISHLIST", message: "Your wishlist could not be saved." } });
    const wishlist = [...new Set(requested.filter((slug) => typeof slug === "string").map((slug) => slug.trim()).filter(Boolean))];
    const available = await Product.distinct("slug", { slug: { $in: wishlist }, isActive: true, isArchived: false });
    const user = await User.findByIdAndUpdate(req.auth.sub, { wishlist: available }, { new: true }).select("wishlist");
    if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Account not found." } });
    return res.json({ success: true, wishlist: user.wishlist });
  } catch (error) { return next(error); }
});

router.post("/toggle", authenticate, async (req, res, next) => {
  try {
    const slug = String(req.body?.productSlug || req.body?.productId || "").trim();
    const product = await Product.findOne({ slug, isActive: true, isArchived: false }).select("slug");
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product is not available." } });
    const user = await User.findById(req.auth.sub).select("wishlist");
    if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Account not found." } });
    const saved = user.wishlist.includes(slug);
    user.wishlist = saved ? user.wishlist.filter((item) => item !== slug) : [...user.wishlist, slug];
    await user.save();
    return res.json({ success: true, saved: !saved, wishlist: user.wishlist });
  } catch (error) { return next(error); }
});

router.delete("/:slug", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("wishlist");
    if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Account not found." } });
    user.wishlist = user.wishlist.filter((slug) => slug !== req.params.slug);
    await user.save();
    return res.json({ success: true, wishlist: user.wishlist });
  } catch (error) { return next(error); }
});

export default router;
