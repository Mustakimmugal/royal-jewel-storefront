import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254, index: true },
  status: { type: String, enum: ["active", "unsubscribed"], default: "active", index: true },
  subscribedAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

export const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);