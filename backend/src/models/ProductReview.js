import mongoose from "mongoose";

const productReviewSchema = new mongoose.Schema({
  productSlug: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true, trim: true, maxlength: 100 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  isVerifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

productReviewSchema.index({ productSlug: 1, userId: 1 }, { unique: true });
productReviewSchema.index({ productSlug: 1, createdAt: -1 });
export const ProductReview = mongoose.model("ProductReview", productReviewSchema);
