import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { ProductReview } from "../models/ProductReview.js";
import { User } from "../models/User.js";
import { cloudinaryPublicIdFromUrl, deleteCloudinaryImages } from "../services/cloudinary.js";

const router = Router();
const publicFields = "name slug sku description category collection price oldPrice rating reviews badge isNew featured currency stock images imagePublicIds videoUrl variants sizes material weightGrams makingCharges stoneDetails diamondDetails certificate hallmark seo";

router.get("/", async (req, res, next) => {
  try {
    const filter = { isActive: true, isArchived: false };
    if (typeof req.query.category === "string" && req.query.category.length <= 80) filter.category = req.query.category;
    if (typeof req.query.collection === "string" && req.query.collection.length <= 80) filter.collection = req.query.collection;
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.$text = { $search: req.query.search.trim().slice(0, 100) };
    }
    if (req.query.minPrice !== undefined) filter.price = { ...filter.price, $gte: Math.max(0, Number(req.query.minPrice) || 0) };
    if (req.query.maxPrice !== undefined && Number.isFinite(Number(req.query.maxPrice))) filter.price = { ...filter.price, $lte: Math.max(0, Number(req.query.maxPrice)) };
    if (req.query.rating !== undefined && Number.isFinite(Number(req.query.rating))) filter.rating = { $gte: Math.min(5, Math.max(0, Number(req.query.rating))) };
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.isNew === "true") filter.isNew = true;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const sortOptions = {
      newest: { createdAt: -1 },
      lowtoHigh: { price: 1 },
      hightoLow: { price: -1 },
      topRated: { rating: -1, reviews: -1 },
      popular: { reviews: -1, rating: -1 },
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;
    const [products, totalProducts] = await Promise.all([
      Product.find(filter).select(publicFields).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalProducts / limit);
    return res.json({ products, currentPage: page, totalProducts, totalPages, hasMore: page < totalPages });
  } catch (error) {
    return next(error);
  }
});

router.get("/filters/options", async (_req, res, next) => {
  try {
    const active = { isActive: true, isArchived: false };
    const [categories, collections] = await Promise.all([
      Product.distinct("category", active),
      Product.distinct("collection", { ...active, collection: { $ne: "" } }),
    ]);
    return res.json({ categories: ["All", ...categories.filter(Boolean)], collections: ["All", ...collections.filter(Boolean)] });
  } catch (error) { return next(error); }
});

router.get("/:slug/similar", async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true, isArchived: false }).select("category collection").lean();
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product could not be found." } });
    const products = await Product.find({ slug: { $ne: req.params.slug }, isActive: true, isArchived: false, $or: [{ category: product.category }, ...(product.collection ? [{ collection: product.collection }] : [])] })
      .select(publicFields).sort({ featured: -1, rating: -1, createdAt: -1 }).limit(10).lean();
    return res.json({ products });
  } catch (error) { return next(error); }
});

router.get("/admin", authenticate, requirePermission("products:read"), async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const products = await Product.find({})
      .select(publicFields + " isArchived isActive createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});
router.get("/:slug", async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true, isArchived: false }).select(publicFields).lean();
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product could not be found." } });
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, requirePermission("products:write"), async (req, res, next) => {
  try {
    if (Array.isArray(req.body.images) && req.body.images.length > 4) return res.status(400).json({ error: { code: "TOO_MANY_PRODUCT_IMAGES", message: "A product can have at most four images." } });
    if (Array.isArray(req.body.imagePublicIds) && req.body.imagePublicIds.length > 4) return res.status(400).json({ error: { code: "TOO_MANY_PRODUCT_IMAGES", message: "A product can have at most four uploaded images." } });
    const product = await Product.create(req.body);
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", authenticate, requirePermission("products:write"), async (req, res, next) => {
  try {
    if (Array.isArray(req.body.images) && req.body.images.length > 4) return res.status(400).json({ error: { code: "TOO_MANY_PRODUCT_IMAGES", message: "A product can have at most four images." } });
    if (Array.isArray(req.body.imagePublicIds) && req.body.imagePublicIds.length > 4) return res.status(400).json({ error: { code: "TOO_MANY_PRODUCT_IMAGES", message: "A product can have at most four uploaded images." } });
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product could not be found." } });
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authenticate, requirePermission("products:delete"), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product could not be found." } });
    const cloudinaryIds = [...new Set([
      ...product.imagePublicIds,
      ...product.images.map(cloudinaryPublicIdFromUrl).filter(Boolean),
    ])];
    await deleteCloudinaryImages(cloudinaryIds);
    await Promise.all([
      ProductReview.deleteMany({ productSlug: product.slug }),
      Cart.updateMany({ "items.productSlug": product.slug }, { $pull: { items: { productSlug: product.slug } } }),
      User.updateMany({ wishlist: product.slug }, { $pull: { wishlist: product.slug } }),
    ]);
    await Product.deleteOne({ _id: product._id });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
