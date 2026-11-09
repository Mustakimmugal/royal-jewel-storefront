import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
  description: { type: String, required: true, maxlength: 8000 },
  category: { type: String, required: true, trim: true, maxlength: 80, index: true },
  collection: { type: String, trim: true, maxlength: 80 },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, min: 0, default: 0 },
  badge: { type: String, trim: true, maxlength: 40 },
  isNew: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  currency: { type: String, default: "INR", uppercase: true, minlength: 3, maxlength: 3 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: { type: [String], default: [], validate: { validator: (items) => items.length <= 4, message: "A product can have at most four images." } },
  imagePublicIds: { type: [String], default: [], validate: { validator: (items) => items.length <= 4, message: "A product can have at most four uploaded images." } },
  videoUrl: { type: String, trim: true },
  variants: { type: [mongoose.Schema.Types.Mixed], default: [] },
  sizes: { type: [String], default: [] },
  material: { type: String, trim: true, maxlength: 300 },
  weightGrams: { type: Number, min: 0 },
  makingCharges: { type: Number, min: 0 },
  stoneDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  diamondDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  certificate: { type: String, trim: true },
  hallmark: { type: String, trim: true },
  seo: {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 180 },
  },
  isActive: { type: Boolean, default: true, index: true },
  isArchived: { type: Boolean, default: false, index: true },
}, { timestamps: true, versionKey: false });

productSchema.index({ name: "text", description: "text", category: "text" });

export const Product = mongoose.model("Product", productSchema);
