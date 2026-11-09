import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
  discountType: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: 0, min: 0 },
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 0, min: 0 },
  usedCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

couponSchema.index({ isActive: 1, expiryDate: 1 });
export const Coupon = mongoose.model("Coupon", couponSchema);
