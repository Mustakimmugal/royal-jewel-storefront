import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
  image: { type: String, trim: true, default: "" },
}, { timestamps: true, versionKey: false });

export const Category = mongoose.model("Category", categorySchema);
