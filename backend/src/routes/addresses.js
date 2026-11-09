import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();
const fields = ["label", "recipient", "phone", "line1", "line2", "city", "region", "postalCode", "country"];

function cleanAddress(body = {}) {
  return Object.fromEntries(fields.map((key) => [key, String(body[key] || "").trim()]));
}

function validAddress(address) {
  return ["recipient", "phone", "line1", "city", "region", "postalCode", "country"].every((key) => address[key]);
}

router.get("/", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("addresses").lean();
    return res.json({ addresses: (user?.addresses || []).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)) });
  } catch (error) { return next(error); }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const address = cleanAddress(req.body);
    if (!validAddress(address)) return res.status(400).json({ error: { code: "INVALID_ADDRESS", message: "Complete the recipient, phone, street, city, region, postal code, and country." } });
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Account not found." } });
    const isDefault = Boolean(req.body?.isDefault) || user.addresses.length === 0;
    if (isDefault) user.addresses.forEach((item) => { item.isDefault = false; });
    user.addresses.push({ ...address, isDefault });
    await user.save();
    return res.status(201).json({ address: user.addresses[user.addresses.length - 1], addresses: user.addresses });
  } catch (error) { return next(error); }
});

router.patch("/:id", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    const address = user?.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ error: { code: "ADDRESS_NOT_FOUND", message: "Address not found." } });
    const updates = cleanAddress({ ...address.toObject(), ...req.body });
    if (!validAddress(updates)) return res.status(400).json({ error: { code: "INVALID_ADDRESS", message: "Complete the required delivery address fields." } });
    Object.assign(address, updates);
    if (req.body?.isDefault === true) {
      user.addresses.forEach((item) => { item.isDefault = item._id.equals(address._id); });
    }
    await user.save();
    return res.json({ address, addresses: user.addresses });
  } catch (error) { return next(error); }
});

router.patch("/:id/default", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    const address = user?.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ error: { code: "ADDRESS_NOT_FOUND", message: "Address not found." } });
    user.addresses.forEach((item) => { item.isDefault = item._id.equals(address._id); });
    await user.save();
    return res.json({ address, addresses: user.addresses });
  } catch (error) { return next(error); }
});

router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    const address = user?.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ error: { code: "ADDRESS_NOT_FOUND", message: "Address not found." } });
    const wasDefault = address.isDefault;
    address.deleteOne();
    if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
    await user.save();
    return res.json({ success: true, addresses: user.addresses });
  } catch (error) { return next(error); }
});

export default router;
