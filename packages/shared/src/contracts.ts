import { z } from "zod";

export const employmentTypeSchema = z.enum([
  "full-time",
  "part-time",
  "contract",
  "internship",
  "remote",
]);

export const skillLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const languageProficiencySchema = z.enum([
  "basic",
  "conversational",
  "fluent",
  "native",
]);

export const availabilityStatusSchema = z.enum([
  "available",
  "open-to-opportunities",
  "not-available",
]);

export const availabilityTypeSchema = z.enum([
  "full-time",
  "part-time",
  "contract",
]);

export const userRoleSchema = z.enum([
  "talent",
  "job-owner",
  "admin",
]);

const legacyRoleMap = {
  recruiter: "job-owner",
  "hiring-manager": "admin",
  "talent-ops": "admin",
  "platform-admin": "admin",
} as const;

export const normalizeUserRole = (
  roleId: string | null | undefined
): z.infer<typeof userRoleSchema> => {
  if (typeof roleId === "string" && roleId in legacyRoleMap) {
    return legacyRoleMap[roleId as keyof typeof legacyRoleMap];
  }

  return userRoleSchema.safeParse(roleId).success
    ? (roleId as z.infer<typeof userRoleSchema>)
    : "talent";
};

export const applicantSourceSchema = z.enum([
  "platform",
  "manual",
  "csv",
  "excel",
  "pdf",
  "link",
]);

export const screeningProviderSchema = z.enum(["gemini"]);
export const screeningDecisionSchema = z.enum([
  "strong-shortlist",
  "shortlist",
  "hold",
  "reject",
]);
export const screeningConfidenceSchema = z.enum(["high", "medium", "low"]);
export const screeningRiskLevelSchema = z.enum(["low", "medium", "high"]);

export const screeningStatusSchema = z.enum([
  "draft",
  "ready",
  "screened",
]);

export const jobSkillSchema = z.object({
  name: z.string().trim().min(1),
  requiredLevel: skillLevelSchema.default("intermediate"),
  required: z.boolean().default(true),
  weight: z.number().min(0).max(1).optional(),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1),
  degree: z.string().trim().min(1),
  fieldOfStudy: z.string().trim().min(1),
  startYear: z.number().int().min(1900).max(2100).optional(),
  endYear: z.number().int().min(1900).max(2100).optional(),
});

export const experienceSchema = z.object({
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional(),
  description: z.string().trim().min(1),
  technologies: z.array(z.string().trim().min(1)).default([]),
  isCurrent: z.boolean().default(false),
});

export const applicantSkillSchema = z.object({
  name: z.string().trim().min(1),
  level: skillLevelSchema.default("intermediate"),
  yearsOfExperience: z.number().min(0).max(40).default(0),
});

export const applicantLanguageSchema = z.object({
  name: z.string().trim().min(1),
  proficiency: languageProficiencySchema.default("conversational"),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  issueDate: z.string().trim().optional().or(z.literal("")),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  technologies: z.array(z.string().trim().min(1)).default([]),
  role: z.string().trim().min(1),
  link: z.string().trim().url().optional().or(z.literal("")),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional().or(z.literal("")),
});

export const availabilitySchema = z.object({
  status: availabilityStatusSchema.default("open-to-opportunities"),
  type: availabilityTypeSchema.default("full-time"),
  startDate: z.string().trim().optional().or(z.literal("")),
});

export const createUserInputSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
  roleId: userRoleSchema,
  location: z.string().trim().min(2),
});

export const loginInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const createJobInputSchema = z.object({
  title: z.string().trim().min(2),
  department: z.string().trim().min(2),
  location: z.string().trim().min(2),
  employmentType: employmentTypeSchema,
  summary: z.string().trim().min(20),
  idealCandidate: z.string().trim().min(20),
  minimumExperienceYears: z.number().min(0).max(40),
  shortlistLimit: z.number().int().min(1).max(20).default(10),
  requiredSkills: z.array(jobSkillSchema).min(1),
  educationPreferences: z.array(z.string().trim().min(2)).default([]),
});

export const updateJobInputSchema = createJobInputSchema.partial();

export const createApplicantInputSchema = z.object({
  fullName: z.string().trim().min(2),
  headline: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  location: z.string().trim().min(2),
  source: applicantSourceSchema.default("manual"),
  resumeUrl: z.string().trim().url().optional().or(z.literal("")),
  resumeFileName: z.string().trim().optional().or(z.literal("")),
  resumeText: z.string().trim().optional(),
  profileSummary: z.string().trim().min(20),
  totalExperienceYears: z.number().min(0).max(50),
  education: z.array(educationSchema).default([]),
  skills: z.array(applicantSkillSchema).default([]),
  languages: z.array(applicantLanguageSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  availability: availabilitySchema,
  socialLinks: z.record(z.string().trim().url()).default({}),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const screeningBreakdownSchema = z.object({
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
});

export const candidateReasoningSchema = z.object({
  summary: z.string().trim().min(10),
  strengths: z.array(z.string().trim().min(1)).min(1),
  gaps: z.array(z.string().trim().min(1)).min(1),
  recommendation: z.string().trim().min(10),
});

export const authUserSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  roleId: userRoleSchema,
  location: z.string().trim().min(2),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
});

export const storedUserRecordSchema = authUserSchema.extend({
  passwordHash: z.string().trim().min(1),
});

export const talentProfileRecordSchema = createApplicantInputSchema.extend({
  id: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
});

export const jobRecordSchema = createJobInputSchema.extend({
  id: z.string().trim().min(1),
  ownerUserId: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
});

export const applicantRecordSchema = createApplicantInputSchema.extend({
  id: z.string().trim().min(1),
  jobId: z.string().trim().min(1),
  submittedByUserId: z.string().trim().min(1).nullable().default(null),
  screeningStatus: screeningStatusSchema.default("ready"),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
});

export const screeningResultRecordSchema = z.object({
  id: z.string().trim().min(1),
  jobId: z.string().trim().min(1),
  applicantId: z.string().trim().min(1),
  provider: screeningProviderSchema,
  rank: z.number().int().min(1),
  matchScore: z.number().min(0).max(100),
  breakdown: screeningBreakdownSchema,
  reasoning: candidateReasoningSchema,
  decision: screeningDecisionSchema.optional(),
  confidence: screeningConfidenceSchema.optional(),
  riskLevel: screeningRiskLevelSchema.optional(),
  matchedSkills: z.array(z.string().trim().min(1)).default([]),
  missingSkills: z.array(z.string().trim().min(1)).default([]),
  createdAt: z.string().trim().min(1),
});

export const screeningOverviewSchema = z.object({
  generatedAt: z.string().trim().min(1),
  provider: screeningProviderSchema,
  totalApplicants: z.number().int().min(0),
  shortlistedCount: z.number().int().min(0),
  rejectedCount: z.number().int().min(0),
  averageMatchScore: z.number().min(0).max(100),
  overallJobFitSummary: z.string().trim().min(10),
  topCandidateSummaries: z.array(z.string().trim().min(1)).default([]),
});

export const dashboardSummarySchema = z.object({
  totalJobs: z.number().int().min(0),
  totalApplicants: z.number().int().min(0),
  screenedApplicants: z.number().int().min(0),
  averageMatchScore: z.number().min(0).max(100),
});

export const platformStatusSchema = z.object({
  repository: z.enum(["memory", "mongo"]),
  screeningProvider: screeningProviderSchema,
  aiEnabled: z.boolean(),
  ingestionChannels: z.array(z.string().trim().min(1)).default([]),
});

export const dashboardJobSnapshotSchema = z.object({
  job: jobRecordSchema,
  applicantCount: z.number().int().min(0),
  shortlistCount: z.number().int().min(0),
  topMatchScore: z.number().min(0).max(100).nullable(),
});

export const dashboardResponseSchema = z.object({
  summary: dashboardSummarySchema,
  jobs: z.array(dashboardJobSnapshotSchema),
  platform: platformStatusSchema,
});

export const notificationToneSchema = z.enum([
  "info",
  "success",
  "warning",
]);

export const notificationRecordSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  href: z.string().trim().min(1),
  actionLabel: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  badge: z.string().trim().min(1),
  tone: notificationToneSchema,
  isRead: z.boolean(),
  readAt: z.string().trim().min(1).nullable(),
});

export const notificationSummarySchema = z.object({
  total: z.number().int().min(0),
  read: z.number().int().min(0),
  unread: z.number().int().min(0),
});

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationRecordSchema),
  summary: notificationSummarySchema,
});

export const markNotificationsReadInputSchema = z.object({
  notificationIds: z.array(z.string().trim().min(1)).min(1),
});

export const notificationReadRecordSchema = z.object({
  id: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  notificationId: z.string().trim().min(1),
  readAt: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
});

export const publicJobsResponseSchema = z.object({
  jobs: z.array(jobRecordSchema),
});

export const publicJobResponseSchema = z.object({
  job: jobRecordSchema,
});

export const jobDetailResponseSchema = z.object({
  job: jobRecordSchema,
  applicants: z.array(applicantRecordSchema),
  screenings: z.array(screeningResultRecordSchema),
  screeningOverview: screeningOverviewSchema.nullable(),
});

export const talentApplicationRecordSchema = z.object({
  applicationId: z.string().trim().min(1),
  submittedAt: z.string().trim().min(1),
  job: jobRecordSchema,
  applicant: applicantRecordSchema,
  screening: screeningResultRecordSchema.nullable(),
});

export const talentApplicationsResponseSchema = z.object({
  applications: z.array(talentApplicationRecordSchema),
});

export const talentProfileResponseSchema = z.object({
  profile: talentProfileRecordSchema.nullable(),
});

export const authResponseSchema = z.object({
  user: authUserSchema,
});

export type EmploymentType = z.infer<typeof employmentTypeSchema>;
export type SkillLevel = z.infer<typeof skillLevelSchema>;
export type LanguageProficiency = z.infer<typeof languageProficiencySchema>;
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;
export type AvailabilityType = z.infer<typeof availabilityTypeSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ApplicantSource = z.infer<typeof applicantSourceSchema>;
export type ScreeningProvider = z.infer<typeof screeningProviderSchema>;
export type ScreeningDecision = z.infer<typeof screeningDecisionSchema>;
export type ScreeningConfidence = z.infer<typeof screeningConfidenceSchema>;
export type ScreeningRiskLevel = z.infer<typeof screeningRiskLevelSchema>;
export type ScreeningStatus = z.infer<typeof screeningStatusSchema>;
export type JobSkill = z.infer<typeof jobSkillSchema>;
export type EducationRecord = z.infer<typeof educationSchema>;
export type ExperienceRecord = z.infer<typeof experienceSchema>;
export type ApplicantSkill = z.infer<typeof applicantSkillSchema>;
export type ApplicantLanguage = z.infer<typeof applicantLanguageSchema>;
export type CertificationRecord = z.infer<typeof certificationSchema>;
export type ProjectRecord = z.infer<typeof projectSchema>;
export type AvailabilityRecord = z.infer<typeof availabilitySchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type CreateJobInput = z.infer<typeof createJobInputSchema>;
export type UpdateJobInput = z.infer<typeof updateJobInputSchema>;
export type CreateApplicantInput = z.infer<typeof createApplicantInputSchema>;
export type ScreeningBreakdown = z.infer<typeof screeningBreakdownSchema>;
export type CandidateReasoning = z.infer<typeof candidateReasoningSchema>;
export type ScreeningOverview = z.infer<typeof screeningOverviewSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type StoredUserRecord = z.infer<typeof storedUserRecordSchema>;
export type TalentProfileRecord = z.infer<typeof talentProfileRecordSchema>;
export type JobRecord = z.infer<typeof jobRecordSchema>;
export type ApplicantRecord = z.infer<typeof applicantRecordSchema>;
export type ScreeningResultRecord = z.infer<
  typeof screeningResultRecordSchema
>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type PlatformStatus = z.infer<typeof platformStatusSchema>;
export type DashboardJobSnapshot = z.infer<typeof dashboardJobSnapshotSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type NotificationTone = z.infer<typeof notificationToneSchema>;
export type NotificationRecord = z.infer<typeof notificationRecordSchema>;
export type NotificationSummary = z.infer<typeof notificationSummarySchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
export type MarkNotificationsReadInput = z.infer<
  typeof markNotificationsReadInputSchema
>;
export type NotificationReadRecord = z.infer<
  typeof notificationReadRecordSchema
>;
export type PublicJobsResponse = z.infer<typeof publicJobsResponseSchema>;
export type PublicJobResponse = z.infer<typeof publicJobResponseSchema>;
export type JobDetailResponse = z.infer<typeof jobDetailResponseSchema>;
export type TalentApplicationRecord = z.infer<
  typeof talentApplicationRecordSchema
>;
export type TalentApplicationsResponse = z.infer<
  typeof talentApplicationsResponseSchema
>;
export type TalentProfileResponse = z.infer<typeof talentProfileResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
