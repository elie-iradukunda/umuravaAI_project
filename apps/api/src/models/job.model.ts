import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const jobSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    requiredLevel: { type: String, required: true },
    required: { type: Boolean, required: true, default: true },
    weight: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    employmentType: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    idealCandidate: { type: String, required: true, trim: true },
    minimumExperienceYears: { type: Number, required: true, min: 0 },
    shortlistLimit: { type: Number, required: true, min: 1, max: 20 },
    requiredSkills: { type: [jobSkillSchema], default: [] },
    educationPreferences: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const JobModel = models.Job ?? model("Job", jobSchema);
