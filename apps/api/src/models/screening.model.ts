import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const breakdownSchema = new Schema(
  {
    skills: { type: Number, required: true, min: 0, max: 100 },
    experience: { type: Number, required: true, min: 0, max: 100 },
    education: { type: Number, required: true, min: 0, max: 100 },
    relevance: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const reasoningSchema = new Schema(
  {
    summary: { type: String, required: true, trim: true },
    strengths: { type: [String], required: true, default: [] },
    gaps: { type: [String], required: true, default: [] },
    recommendation: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const screeningSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    applicantId: { type: String, required: true, index: true },
    provider: { type: String, required: true, trim: true },
    rank: { type: Number, required: true, min: 1 },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    breakdown: { type: breakdownSchema, required: true },
    reasoning: { type: reasoningSchema, required: true },
  },
  { timestamps: true }
);

export const ScreeningModel = models.Screening ?? model("Screening", screeningSchema);
