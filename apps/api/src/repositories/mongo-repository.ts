import mongoose from "mongoose";
import type {
  ApplicantRecord,
  CreateApplicantInput,
  CreateJobInput,
  DashboardSummary,
  JobRecord,
  NotificationReadRecord,
  ScreeningResultRecord,
  StoredUserRecord,
  TalentProfileRecord,
  UpdateJobInput,
} from "@umurava/shared";
import { normalizeUserRole } from "@umurava/shared";

import { ApplicantModel } from "../models/applicant.model.js";
import { JobModel } from "../models/job.model.js";
import { NotificationReadModel } from "../models/notification-read.model.js";
import { ScreeningModel } from "../models/screening.model.js";
import { UserModel } from "../models/user.model.js";
import type {
  CreateApplicantsOptions,
  CreateStoredUserInput,
  DashboardSummaryOptions,
  ListJobsOptions,
  Repository,
} from "./types.js";
import {
  computeAverageMatchScore,
  withApplicantRecord,
  withJobRecord,
  withTalentProfileRecord,
  withUserRecord,
} from "./utils.js";

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(String(value)).toISOString();
};

const mapJob = (doc: Record<string, unknown>): JobRecord => ({
  id: String(doc.id),
  ownerUserId: String(doc.ownerUserId),
  title: String(doc.title),
  department: String(doc.department),
  location: String(doc.location),
  employmentType: doc.employmentType as JobRecord["employmentType"],
  summary: String(doc.summary),
  idealCandidate: String(doc.idealCandidate),
  minimumExperienceYears: Number(doc.minimumExperienceYears),
  shortlistLimit: Number(doc.shortlistLimit),
  requiredSkills: (doc.requiredSkills as JobRecord["requiredSkills"]) ?? [],
  educationPreferences:
    (doc.educationPreferences as JobRecord["educationPreferences"]) ?? [],
  createdAt: toIsoString(doc.createdAt),
  updatedAt: toIsoString(doc.updatedAt),
});

const mapApplicant = (doc: Record<string, unknown>): ApplicantRecord => ({
  id: String(doc.id),
  jobId: String(doc.jobId),
  submittedByUserId:
    doc.submittedByUserId == null ? null : String(doc.submittedByUserId),
  fullName: String(doc.fullName),
  headline: String(doc.headline ?? ""),
  email: String(doc.email ?? ""),
  phone: String(doc.phone ?? ""),
  location: String(doc.location),
  source: doc.source as ApplicantRecord["source"],
  resumeUrl: String(doc.resumeUrl ?? ""),
  resumeFileName: String(doc.resumeFileName ?? ""),
  resumeText: String(doc.resumeText ?? ""),
  profileSummary: String(doc.profileSummary),
  totalExperienceYears: Number(doc.totalExperienceYears),
  education:
    (((doc.education as Record<string, unknown>[]) ?? [])).map((itemDoc) => ({
      institution: String(itemDoc.institution ?? "Not Provided"),
      degree: String(itemDoc.degree ?? itemDoc.qualification ?? "Not Provided"),
      fieldOfStudy: String(itemDoc.fieldOfStudy ?? "Not Provided"),
      startYear:
        itemDoc.startYear == null
          ? undefined
          : Number(itemDoc.startYear),
      endYear:
        itemDoc.endYear == null
          ? itemDoc.yearCompleted == null
            ? undefined
            : Number(itemDoc.yearCompleted)
          : Number(itemDoc.endYear),
    })),
  skills:
    (((doc.skills as Record<string, unknown>[]) ?? [])).map((itemDoc) => ({
      name: String(itemDoc.name ?? ""),
      level: itemDoc.level as ApplicantRecord["skills"][number]["level"],
      yearsOfExperience: Number(
        itemDoc.yearsOfExperience ?? itemDoc.years ?? 0
      ),
    })),
  languages: (doc.languages as ApplicantRecord["languages"]) ?? [],
  experience:
    (
      (doc.experience as Record<string, unknown>[]) ??
      (doc.workHistory as Record<string, unknown>[])
    )?.map((itemDoc) => ({
      company: String(itemDoc.company ?? "Not Provided"),
      role: String(itemDoc.role ?? itemDoc.title ?? "Not Provided"),
      startDate: String(itemDoc.startDate ?? ""),
      endDate: String(itemDoc.endDate ?? ""),
      description: String(
        itemDoc.description ??
          (Array.isArray(itemDoc.highlights) ? itemDoc.highlights.join(". ") : "") ??
          ""
      ),
      technologies:
        (itemDoc.technologies as ApplicantRecord["experience"][number]["technologies"]) ??
        [],
      isCurrent: Boolean(itemDoc.isCurrent ?? !itemDoc.endDate),
    })) ?? [],
  certifications: (doc.certifications as ApplicantRecord["certifications"]) ?? [],
  projects: (doc.projects as ApplicantRecord["projects"]) ?? [],
  availability:
    (doc.availability as ApplicantRecord["availability"]) ?? {
      status: "open-to-opportunities",
      type: "full-time",
      startDate: "",
    },
  socialLinks:
    doc.socialLinks instanceof Map
      ? Object.fromEntries(doc.socialLinks.entries())
      : (doc.socialLinks as ApplicantRecord["socialLinks"]) ?? {},
  tags: (doc.tags as ApplicantRecord["tags"]) ?? [],
  screeningStatus: doc.screeningStatus as ApplicantRecord["screeningStatus"],
  createdAt: toIsoString(doc.createdAt),
  updatedAt: toIsoString(doc.updatedAt),
});

const mapScreening = (doc: Record<string, unknown>): ScreeningResultRecord => ({
  id: String(doc.id),
  jobId: String(doc.jobId),
  applicantId: String(doc.applicantId),
  provider: doc.provider as ScreeningResultRecord["provider"],
  rank: Number(doc.rank),
  matchScore: Number(doc.matchScore),
  breakdown: doc.breakdown as ScreeningResultRecord["breakdown"],
  reasoning: doc.reasoning as ScreeningResultRecord["reasoning"],
  decision:
    (doc.decision as ScreeningResultRecord["decision"] | undefined) ??
    undefined,
  confidence:
    (doc.confidence as ScreeningResultRecord["confidence"] | undefined) ??
    undefined,
  riskLevel:
    (doc.riskLevel as ScreeningResultRecord["riskLevel"] | undefined) ??
    undefined,
  matchedSkills: Array.isArray(doc.matchedSkills)
    ? (doc.matchedSkills as ScreeningResultRecord["matchedSkills"])
    : [],
  missingSkills: Array.isArray(doc.missingSkills)
    ? (doc.missingSkills as ScreeningResultRecord["missingSkills"])
    : [],
  createdAt: toIsoString(doc.createdAt),
});

const mapUser = (doc: Record<string, unknown>): StoredUserRecord => ({
  id: String(doc.id),
  name: String(doc.name),
  email: String(doc.email),
  passwordHash: String(doc.passwordHash),
  roleId: normalizeUserRole(String(doc.roleId ?? "")),
  location: String(doc.location),
  createdAt: toIsoString(doc.createdAt),
  updatedAt: toIsoString(doc.updatedAt),
});

const mapTalentProfile = (
  userId: string,
  doc: Record<string, unknown>
): TalentProfileRecord | null => {
  const rawProfile = doc.talentProfile;

  if (!rawProfile || typeof rawProfile !== "object") {
    return null;
  }

  return withTalentProfileRecord(
    userId,
    rawProfile as CreateApplicantInput,
    {
      id: `talent_profile_${userId}`,
      createdAt:
        doc.createdAt == null ? undefined : toIsoString(doc.createdAt),
      updatedAt:
        doc.talentProfileUpdatedAt == null
          ? doc.updatedAt == null
            ? undefined
            : toIsoString(doc.updatedAt)
          : toIsoString(doc.talentProfileUpdatedAt),
    }
  );
};

const mapNotificationRead = (
  doc: Record<string, unknown>
): NotificationReadRecord => ({
  id: String(doc.id),
  userId: String(doc.userId),
  notificationId: String(doc.notificationId),
  readAt: toIsoString(doc.readAt),
  createdAt: toIsoString(doc.createdAt),
  updatedAt: toIsoString(doc.updatedAt),
});

export class MongoRepository implements Repository {
  public readonly kind = "mongo" as const;

  constructor(private readonly connectionString: string) {}

  async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    await mongoose.connect(this.connectionString);
  }

  async listJobs(options: ListJobsOptions = {}): Promise<JobRecord[]> {
    const jobs = await JobModel.find(
      options.ownerUserId ? { ownerUserId: options.ownerUserId } : {}
    )
      .sort({ updatedAt: -1 })
      .lean();

    return jobs.map((job) => mapJob(job as unknown as Record<string, unknown>));
  }

  async getJob(jobId: string): Promise<JobRecord | null> {
    const job = await JobModel.findOne({ id: jobId }).lean();
    return job ? mapJob(job as unknown as Record<string, unknown>) : null;
  }

  async createJob(ownerUserId: string, input: CreateJobInput): Promise<JobRecord> {
    const job = withJobRecord(ownerUserId, input);
    await JobModel.create(job);
    return job;
  }

  async updateJob(jobId: string, input: UpdateJobInput): Promise<JobRecord | null> {
    const updated = await JobModel.findOneAndUpdate(
      { id: jobId },
      {
        ...input,
        updatedAt: new Date(),
      },
      { new: true, lean: true }
    );

    return updated
      ? mapJob(updated as unknown as Record<string, unknown>)
      : null;
  }

  async listApplicants(jobId: string): Promise<ApplicantRecord[]> {
    const applicants = await ApplicantModel.find({ jobId })
      .sort({ updatedAt: -1 })
      .lean();

    return applicants.map((item) =>
      mapApplicant(item as unknown as Record<string, unknown>)
    );
  }

  async createApplicants(
    jobId: string,
    inputs: CreateApplicantInput[],
    options: CreateApplicantsOptions = {}
  ): Promise<ApplicantRecord[]> {
    const created = inputs.map((input) =>
      withApplicantRecord(jobId, input, {
        submittedByUserId: options.submittedByUserId ?? null,
      })
    );
    await ApplicantModel.insertMany(created);
    return created;
  }

  async listApplicantsBySubmittedUser(userId: string): Promise<ApplicantRecord[]> {
    const applicants = await ApplicantModel.find({ submittedByUserId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    return applicants.map((item) =>
      mapApplicant(item as unknown as Record<string, unknown>)
    );
  }

  async resetJobScreening(jobId: string): Promise<void> {
    await Promise.all([
      ApplicantModel.updateMany(
        { jobId },
        { screeningStatus: "ready", updatedAt: new Date() }
      ),
      ScreeningModel.deleteMany({ jobId }),
    ]);
  }

  async markApplicantsScreened(jobId: string): Promise<void> {
    await ApplicantModel.updateMany(
      { jobId },
      { screeningStatus: "screened", updatedAt: new Date() }
    );
  }

  async listScreenings(jobId: string): Promise<ScreeningResultRecord[]> {
    const screenings = await ScreeningModel.find({ jobId })
      .sort({ rank: 1 })
      .lean();

    return screenings.map((item) =>
      mapScreening(item as unknown as Record<string, unknown>)
    );
  }

  async replaceScreenings(
    jobId: string,
    screenings: ScreeningResultRecord[]
  ): Promise<ScreeningResultRecord[]> {
    await ScreeningModel.deleteMany({ jobId });

    if (screenings.length > 0) {
      await ScreeningModel.insertMany(
        screenings.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.createdAt),
        }))
      );
    }

    return screenings;
  }

  async getDashboardSummary(
    options: DashboardSummaryOptions = {}
  ): Promise<DashboardSummary> {
    const jobFilter = options.ownerUserId ? { ownerUserId: options.ownerUserId } : {};
    const jobs = await JobModel.find(jobFilter, { id: 1 }).lean();
    const jobIds = jobs
      .map((job) => String((job as unknown as { id?: string }).id ?? ""))
      .filter(Boolean);

    if (jobIds.length === 0) {
      return {
        totalJobs: 0,
        totalApplicants: 0,
        screenedApplicants: 0,
        averageMatchScore: 0,
      };
    }

    const [applicants, screenings] = await Promise.all([
      ApplicantModel.countDocuments({ jobId: { $in: jobIds } }),
      ScreeningModel.find({ jobId: { $in: jobIds } }).lean(),
    ]);

    return {
      totalJobs: jobIds.length,
      totalApplicants: applicants,
      screenedApplicants: screenings.length,
      averageMatchScore: computeAverageMatchScore(
        screenings.map((item) =>
          mapScreening(item as unknown as Record<string, unknown>)
        )
      ),
    };
  }

  async getUserById(userId: string): Promise<StoredUserRecord | null> {
    const user = await UserModel.findOne({ id: userId }).lean();
    return user ? mapUser(user as unknown as Record<string, unknown>) : null;
  }

  async getUserByEmail(email: string): Promise<StoredUserRecord | null> {
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).lean();

    return user ? mapUser(user as unknown as Record<string, unknown>) : null;
  }

  async createUser(input: CreateStoredUserInput): Promise<StoredUserRecord> {
    const user = withUserRecord(input);
    await UserModel.create(user);
    return user;
  }

  async getTalentProfileByUserId(
    userId: string
  ): Promise<TalentProfileRecord | null> {
    const user = await UserModel.findOne(
      { id: userId },
      {
        id: 1,
        talentProfile: 1,
        talentProfileUpdatedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    ).lean();

    if (!user) {
      return null;
    }

    return mapTalentProfile(userId, user as unknown as Record<string, unknown>);
  }

  async upsertTalentProfile(
    userId: string,
    input: CreateApplicantInput
  ): Promise<TalentProfileRecord> {
    const now = new Date();
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      {
        talentProfile: input,
        talentProfileUpdatedAt: now,
        updatedAt: now,
      },
      {
        new: true,
        lean: true,
        projection: {
          id: 1,
          talentProfile: 1,
          talentProfileUpdatedAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    if (!updatedUser) {
      throw new Error("User not found.");
    }

    return (
      mapTalentProfile(userId, updatedUser as unknown as Record<string, unknown>) ??
      withTalentProfileRecord(userId, input)
    );
  }

  async listNotificationReadsByUserId(
    userId: string
  ): Promise<NotificationReadRecord[]> {
    const reads = await NotificationReadModel.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return reads.map((item) =>
      mapNotificationRead(item as unknown as Record<string, unknown>)
    );
  }

  async markNotificationsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<NotificationReadRecord[]> {
    const uniqueIds = [...new Set(notificationIds.map((item) => item.trim()).filter(Boolean))];

    if (uniqueIds.length === 0) {
      return this.listNotificationReadsByUserId(userId);
    }

    const now = new Date();

    await Promise.all(
      uniqueIds.map((notificationId) =>
        NotificationReadModel.findOneAndUpdate(
          { userId, notificationId },
          {
            $set: {
              readAt: now,
            },
            $setOnInsert: {
              id: `notification_read_${new mongoose.Types.ObjectId().toString()}`,
              userId,
              notificationId,
              createdAt: now,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        )
      )
    );

    return this.listNotificationReadsByUserId(userId);
  }
}
