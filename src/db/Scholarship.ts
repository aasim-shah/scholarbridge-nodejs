import mongoose from "mongoose";

const ScholarshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  country: { type: String, required: true },
  level: { type: String, required: true },
  field: { type: String, required: true },
  category: { type: String, required: true },
  deadline: { type: Date, required: true },
  description: { type: String, required: true },
  link: { type: String, required: true },
  amount: { type: String },
  currency: { type: String },
  is_verified: { type: Boolean, default: false }, // True = manually verified by admin
  verification_notes: { type: String }, // Admin notes about verification
  source: { type: String }, // How it was added: 'openai-web-search', 'manual', etc.
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { timestamps: true });

ScholarshipSchema.index({ title: 1, organization: 1, deadline: 1 }, { unique: true });

export const Scholarship = mongoose.model("Scholarship", ScholarshipSchema);
