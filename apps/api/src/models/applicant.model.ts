import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const educationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  { _id: false }
);

const applicantSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const applicantLanguageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const experienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, trim: true, default: "" },
    description: { type: String, required: true, trim: true },
    technologies: { type: [String], default: [] },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    technologies: { type: [String], default: [] },
    role: { type: String, required: true, trim: true },
    link: { type: String, trim: true, default: "" },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    status: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    startDate: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const applicantSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    submittedByUserId: { type: String, trim: true, default: null, index: true },
    fullName: { type: String, required: true, trim: true },
    headline: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    resumeUrl: { type: String, trim: true, default: "" },
    resumeFileName: { type: String, trim: true, default: "" },
    resumeText: { type: String, trim: true, default: "" },
    profileSummary: { type: String, required: true, trim: true },
    totalExperienceYears: { type: Number, required: true, min: 0 },
    education: { type: [educationSchema], default: [] },
    skills: { type: [applicantSkillSchema], default: [] },
    languages: { type: [applicantLanguageSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    availability: { type: availabilitySchema, required: true },
    socialLinks: { type: Map, of: String, default: {} },
    tags: { type: [String], default: [] },
    screeningStatus: { type: String, required: true, default: "ready" },
  },
  { timestamps: true }
);

export const ApplicantModel = models.Applicant ?? model("Applicant", applicantSchema);
