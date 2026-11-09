import mongoose from "mongoose";

const passwordResetChallengeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  tokenHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  verifiedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true, versionKey: false });

export const PasswordResetChallenge = mongoose.model("PasswordResetChallenge", passwordResetChallengeSchema);
