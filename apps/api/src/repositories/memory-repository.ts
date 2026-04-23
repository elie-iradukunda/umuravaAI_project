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

import type {
  CreateApplicantsOptions,
  CreateStoredUserInput,
  DashboardSummaryOptions,
  ListJobsOptions,
  Repository,
} from "./types.js";
import {
  computeAverageMatchScore,
  markApplicantAsReady,
  markApplicantAsScreened,
  mergeJobRecord,
  sortByCreatedAtDesc,
  withApplicantRecord,
  withJobRecord,
  withNotificationReadRecord,
  withTalentProfileRecord,
  withUserRecord,
} from "./utils.js";

export class MemoryRepository implements Repository {
  public readonly kind = "memory" as const;

  private jobs = new Map<string, JobRecord>();
  private applicants = new Map<string, ApplicantRecord>();
  private screenings = new Map<string, ScreeningResultRecord>();
  private users = new Map<string, StoredUserRecord>();
  private talentProfiles = new Map<string, TalentProfileRecord>();
  private notificationReads = new Map<string, NotificationReadRecord>();

  async listJobs(options: ListJobsOptions = {}): Promise<JobRecord[]> {
    return sortByCreatedAtDesc(
      Array.from(this.jobs.values())
        .filter(
          (item) =>
            !options.ownerUserId || item.ownerUserId === options.ownerUserId
        )
        .map((item) => structuredClone(item))
    );
  }

  async getJob(jobId: string): Promise<JobRecord | null> {
    const job = this.jobs.get(jobId);
    return job ? structuredClone(job) : null;
  }

  async createJob(ownerUserId: string, input: CreateJobInput): Promise<JobRecord> {
    const job = withJobRecord(ownerUserId, input);
    this.jobs.set(job.id, job);
    return structuredClone(job);
  }

  async updateJob(jobId: string, input: UpdateJobInput): Promise<JobRecord | null> {
    const current = this.jobs.get(jobId);
    if (!current) {
      return null;
    }

    const updated = mergeJobRecord(current, input);
    this.jobs.set(jobId, updated);
    return structuredClone(updated);
  }

  async listApplicants(jobId: string): Promise<ApplicantRecord[]> {
    return sortByCreatedAtDesc(
      Array.from(this.applicants.values())
        .filter((item) => item.jobId === jobId)
        .map((item) => structuredClone(item))
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

    created.forEach((record) => {
      this.applicants.set(record.id, record);
    });

    return created.map((item) => structuredClone(item));
  }

  async listApplicantsBySubmittedUser(userId: string): Promise<ApplicantRecord[]> {
    return sortByCreatedAtDesc(
      Array.from(this.applicants.values())
        .filter((item) => item.submittedByUserId === userId)
        .map((item) => structuredClone(item))
    );
  }

  async resetJobScreening(jobId: string): Promise<void> {
    Array.from(this.applicants.values())
      .filter((item) => item.jobId === jobId)
      .forEach((item) => {
        this.applicants.set(item.id, markApplicantAsReady(item));
      });

    Array.from(this.screenings.values())
      .filter((item) => item.jobId === jobId)
      .forEach((item) => {
        this.screenings.delete(item.id);
      });
  }

  async markApplicantsScreened(jobId: string): Promise<void> {
    Array.from(this.applicants.values())
      .filter((item) => item.jobId === jobId)
      .forEach((item) => {
        this.applicants.set(item.id, markApplicantAsScreened(item));
      });
  }

  async listScreenings(jobId: string): Promise<ScreeningResultRecord[]> {
    return [...this.screenings.values()]
      .filter((item) => item.jobId === jobId)
      .sort((left, right) => left.rank - right.rank)
      .map((item) => structuredClone(item));
  }

  async replaceScreenings(
    jobId: string,
    screenings: ScreeningResultRecord[]
  ): Promise<ScreeningResultRecord[]> {
    Array.from(this.screenings.values())
      .filter((item) => item.jobId === jobId)
      .forEach((item) => {
        this.screenings.delete(item.id);
      });

    screenings.forEach((screening) => {
      this.screenings.set(screening.id, screening);
    });

    return screenings.map((item) => structuredClone(item));
  }

  async getDashboardSummary(
    options: DashboardSummaryOptions = {}
  ): Promise<DashboardSummary> {
    const scopedJobs = Array.from(this.jobs.values()).filter(
      (job) => !options.ownerUserId || job.ownerUserId === options.ownerUserId
    );
    const scopedJobIds = new Set(scopedJobs.map((job) => job.id));
    const scopedApplicants = Array.from(this.applicants.values()).filter((applicant) =>
      scopedJobIds.has(applicant.jobId)
    );
    const scopedScreenings = Array.from(this.screenings.values()).filter((screening) =>
      scopedJobIds.has(screening.jobId)
    );

    return {
      totalJobs: scopedJobs.length,
      totalApplicants: scopedApplicants.length,
      screenedApplicants: scopedScreenings.length,
      averageMatchScore: computeAverageMatchScore(scopedScreenings),
    };
  }

  async getUserById(userId: string): Promise<StoredUserRecord | null> {
    const user = this.users.get(userId);
    return user ? structuredClone(user) : null;
  }

  async getUserByEmail(email: string): Promise<StoredUserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = Array.from(this.users.values()).find(
      (item) => item.email.toLowerCase() === normalizedEmail
    );

    return user ? structuredClone(user) : null;
  }

  async createUser(input: CreateStoredUserInput): Promise<StoredUserRecord> {
    const user = withUserRecord(input);
    this.users.set(user.id, user);
    return structuredClone(user);
  }

  async getTalentProfileByUserId(
    userId: string
  ): Promise<TalentProfileRecord | null> {
    const profile = this.talentProfiles.get(userId);
    return profile ? structuredClone(profile) : null;
  }

  async upsertTalentProfile(
    userId: string,
    input: CreateApplicantInput
  ): Promise<TalentProfileRecord> {
    const current = this.talentProfiles.get(userId);
    const profile = withTalentProfileRecord(userId, input, {
      id: current?.id,
      createdAt: current?.createdAt,
      updatedAt: new Date().toISOString(),
    });

    this.talentProfiles.set(userId, profile);
    return structuredClone(profile);
  }

  async listNotificationReadsByUserId(
    userId: string
  ): Promise<NotificationReadRecord[]> {
    return sortByCreatedAtDesc(
      Array.from(this.notificationReads.values())
        .filter((item) => item.userId === userId)
        .map((item) => structuredClone(item))
    );
  }

  async markNotificationsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<NotificationReadRecord[]> {
    const notificationIdSet = new Set(
      notificationIds.map((item) => item.trim()).filter(Boolean)
    );

    if (notificationIdSet.size === 0) {
      return this.listNotificationReadsByUserId(userId);
    }

    const now = new Date().toISOString();

    notificationIdSet.forEach((notificationId) => {
      const existing = Array.from(this.notificationReads.values()).find(
        (item) =>
          item.userId === userId && item.notificationId === notificationId
      );

      if (existing) {
        this.notificationReads.set(existing.id, {
          ...existing,
          readAt: now,
          updatedAt: now,
        });
        return;
      }

      const created = withNotificationReadRecord(userId, notificationId, {
        readAt: now,
        createdAt: now,
        updatedAt: now,
      });
      this.notificationReads.set(created.id, created);
    });

    return this.listNotificationReadsByUserId(userId);
  }
}
