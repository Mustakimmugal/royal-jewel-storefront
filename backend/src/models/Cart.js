import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  items: [{
    productSlug: { type: String, required: true },
    size: { type: String, default: "One size", maxlength: 40 },
    quantity: { type: Number, required: true, min: 1, max: 10 },
  }],
  coupon: { code: { type: String, default: "" }, discountAmount: { type: Number, default: 0, min: 0 } },
}, { timestamps: true, versionKey: false });

export const Cart = mongoose.model("Cart", cartSchema);
