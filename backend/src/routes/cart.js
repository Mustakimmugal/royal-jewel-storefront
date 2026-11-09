import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

const router = Router();

async function cartSnapshot(userId) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) return { items: [], subtotal: 0, discountAmount: 0, total: 0, coupon: null };
  const products = await Product.find({ slug: { $in: cart.items.map((item) => item.productSlug) } }).lean();
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const items = cart.items.map((item) => {
    const product = bySlug.get(item.productSlug) || null;
    const unitPrice = product?.price || 0;
    return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = Math.min(subtotal, Number(cart.coupon?.discountAmount || 0));
  return { items, subtotal, discountAmount, total: subtotal - discountAmount, coupon: cart.coupon?.code ? cart.coupon : null };
}

router.get("/", authenticate, async (req, res, next) => {
  try { return res.json({ success: true, cart: await cartSnapshot(req.auth.sub) }); }
  catch (error) { return next(error); }
});

router.put("/sync", authenticate, async (req, res, next) => {
  try {
    const requested = req.body?.items;
    if (!Array.isArray(requested) || requested.length > 30) return res.status(400).json({ error: { code: "INVALID_CART", message: "Your bag contains too many items." } });
    const merged = new Map();
    for (const item of requested) {
      const productSlug = String(item?.productSlug || item?.productId || "").trim().slice(0, 180);
      const size = String(item?.size || "One size").trim().slice(0, 40);
      const quantity = Number(item?.quantity);
      if (!productSlug || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ error: { code: "INVALID_CART_ITEM", message: "One or more bag items are invalid." } });
      const key = `${productSlug}::${size}`;
      const combined = (merged.get(key)?.quantity || 0) + quantity;
      if (combined > 10) return res.status(400).json({ error: { code: "INVALID_QUANTITY", message: "A product quantity cannot exceed ten." } });
      merged.set(key, { productSlug, size, quantity: combined });
    }
    const items = [...merged.values()];
    const products = await Product.find({ slug: { $in: items.map((item) => item.productSlug) }, isActive: true, isArchived: false }).lean();
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    for (const item of items) {
      const product = bySlug.get(item.productSlug);
      if (!product || (product.sizes.length && !product.sizes.includes(item.size)) || item.quantity > product.stock) {
        return res.status(409).json({ error: { code: "CART_ITEM_UNAVAILABLE", message: "A bag item or quantity is no longer available." } });
      }
    }
    const cart = await Cart.findOneAndUpdate(
      { userId: req.auth.sub },
      { $set: { items, coupon: { code: "", discountAmount: 0 } }, $setOnInsert: { userId: req.auth.sub } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return res.json({ success: true, cart: await cartSnapshot(req.auth.sub) });
  } catch (error) { return next(error); }
});

router.post("/add", authenticate, async (req, res, next) => {
  try {
    const productSlug = String(req.body?.productSlug || req.body?.productId || "").trim().slice(0, 180);
    const size = String(req.body?.size || "One size").trim().slice(0, 40);
    const quantity = Number(req.body?.quantity || 1);
    if (!productSlug || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: { code: "INVALID_CART_ITEM", message: "Choose a valid product and quantity." } });
    }
    const product = await Product.findOne({ slug: productSlug, isActive: true, isArchived: false });
    if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "This product is not available." } });
    if (product.sizes.length && !product.sizes.includes(size)) return res.status(400).json({ error: { code: "INVALID_SIZE", message: "Choose an available size." } });
    if (product.stock < quantity) return res.status(409).json({ error: { code: "OUT_OF_STOCK", message: "There is not enough stock for this quantity." } });

    const cart = await Cart.findOneAndUpdate({ userId: req.auth.sub }, { $setOnInsert: { userId: req.auth.sub } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const line = cart.items.find((item) => item.productSlug === productSlug && item.size === size);
    if (line) {
      if (line.quantity + quantity > 10 || line.quantity + quantity > product.stock) return res.status(409).json({ error: { code: "INVALID_QUANTITY", message: "That quantity is not available." } });
      line.quantity += quantity;
    } else {
      cart.items.push({ productSlug, size, quantity });
    }
    cart.coupon = { code: "", discountAmount: 0 };
    await cart.save();
    return res.json({ success: true, message: "Added to your bag.", cart: await cartSnapshot(req.auth.sub) });
  } catch (error) { return next(error); }
});

router.put("/update", authenticate, async (req, res, next) => {
  try {
    const productSlug = String(req.body?.productSlug || req.body?.productId || "");
    const size = String(req.body?.size || "One size");
    const quantity = Number(req.body?.quantity);
    const cart = await Cart.findOne({ userId: req.auth.sub });
    if (!cart) return res.status(404).json({ error: { code: "CART_NOT_FOUND", message: "Your bag is empty." } });
    const line = cart.items.find((item) => item.productSlug === productSlug && item.size === size);
    if (!line) return res.status(404).json({ error: { code: "CART_ITEM_NOT_FOUND", message: "This item is not in your bag." } });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ error: { code: "INVALID_QUANTITY", message: "Choose a quantity from one to ten." } });
    const product = await Product.findOne({ slug: productSlug, isActive: true, isArchived: false });
    if (!product || quantity > product.stock) return res.status(409).json({ error: { code: "OUT_OF_STOCK", message: "That quantity is not available." } });
    line.quantity = quantity;
    cart.coupon = { code: "", discountAmount: 0 };
    await cart.save();
    return res.json({ success: true, message: "Bag updated.", cart: await cartSnapshot(req.auth.sub) });
  } catch (error) { return next(error); }
});

router.delete("/remove/:productSlug", authenticate, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.auth.sub });
    if (!cart) return res.json({ success: true, cart: await cartSnapshot(req.auth.sub) });
    const size = String(req.query.size || "One size");
    cart.items = cart.items.filter((item) => item.productSlug !== req.params.productSlug || item.size !== size);
    cart.coupon = { code: "", discountAmount: 0 };
    await cart.save();
    return res.json({ success: true, cart: await cartSnapshot(req.auth.sub) });
  } catch (error) { return next(error); }
});

router.delete("/", authenticate, async (req, res, next) => {
  try {
    await Cart.deleteOne({ userId: req.auth.sub });
    return res.json({ success: true, message: "Your bag is clear.", cart: await cartSnapshot(req.auth.sub) });
  } catch (error) { return next(error); }
});

export default router;
