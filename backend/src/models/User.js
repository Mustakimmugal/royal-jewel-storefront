import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  displayName: { type: String, trim: true, maxlength: 100 },
  passwordHash: { type: String, select: false },
  recoveryAnswers: [{ questionId: { type: String, required: true }, answerHash: { type: String, required: true } }],
  role: { type: String, enum: ["customer", "admin", "employee"], default: "customer", index: true },
  permissions: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String, trim: true, maxlength: 2048 },
  profileImagePublicId: { type: String, trim: true, maxlength: 255 },
  wishlist: { type: [String], default: [] },
  addresses: [{
    label: { type: String, trim: true, maxlength: 40 },
    recipient: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true },
    line1: { type: String, trim: true, maxlength: 180 },
    line2: { type: String, trim: true, maxlength: 180 },
    city: { type: String, trim: true, maxlength: 100 },
    region: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 24 },
    country: { type: String, trim: true, maxlength: 80 },
    isDefault: { type: Boolean, default: false },
  }],
}, { timestamps: true, versionKey: false });

userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });

export const User = mongoose.model("User", userSchema);
