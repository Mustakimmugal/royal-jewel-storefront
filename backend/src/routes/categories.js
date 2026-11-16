import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

const router = Router();
router.get("/", async (_req, res, next) => {
  try { const usedNames = await Product.distinct("category");
    await Promise.all(usedNames.filter(Boolean).map((name) => Category.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true })));
    return res.json({ categories: await Category.find({}).sort({ name: 1 }).lean() }); }
  catch (error) { return next(error); }
});
router.post("/", authenticate, requirePermission("products:write"), async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 80) return res.status(400).json({ error: { code: "INVALID_CATEGORY", message: "Enter a category name up to 80 characters." } });
    const category = await Category.create({ name });
    return res.status(201).json({ category });
  } catch (error) { return next(error); }
});
router.delete("/:id", authenticate, requirePermission("products:write"), async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: { code: "CATEGORY_NOT_FOUND", message: "Category not found." } });
    if (await Product.exists({ category: category.name })) return res.status(409).json({ error: { code: "CATEGORY_IN_USE", message: "Move or remove products in this category before deleting it." } });
    await category.deleteOne();
    return res.status(204).end();
  } catch (error) { return next(error); }
});
export default router;
