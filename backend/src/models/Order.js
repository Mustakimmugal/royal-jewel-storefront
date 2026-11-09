import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productSlug: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  image: { type: String, default: "" },
  size: { type: String, default: "One size" },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  recipient: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true, maxlength: 180 },
  line2: { type: String, trim: true, maxlength: 180 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  region: { type: String, required: true, trim: true, maxlength: 100 },
  postalCode: { type: String, required: true, trim: true, maxlength: 24 },
  country: { type: String, required: true, trim: true, maxlength: 80 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: addressSchema, required: true },
  currency: { type: String, default: "INR", uppercase: true },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  coupon: { code: { type: String, default: "" }, discountAmount: { type: Number, default: 0, min: 0 } },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["COD"], default: "COD" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  fulfillmentStatus: { type: String, enum: ["pending", "processing", "packed", "shipped", "delivered", "cancelled", "refund"], default: "pending", index: true },
  returnRequest: {
    isRequested: { type: Boolean, default: false },
    reason: { type: String, default: "", maxlength: 1000 },
    status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
    requestedAt: Date,
    adminNote: { type: String, default: "", maxlength: 1000 },
  },
  refundStatus: { type: String, enum: ["none", "manual", "processed"], default: "none" },
  cancelledAt: Date,
}, { timestamps: true, versionKey: false });

export const Order = mongoose.model("Order", orderSchema);
