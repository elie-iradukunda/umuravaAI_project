import type {
  ApplicantRecord,
  CreateApplicantInput,
  CreateJobInput,
  DashboardSummary,
  JobRecord,
  ScreeningResultRecord,
  StoredUserRecord,
  UpdateJobInput,
} from "@umurava/shared";

import type { CreateStoredUserInput, Repository } from "./types.js";
import {
  computeAverageMatchScore,
  markApplicantAsScreened,
  mergeJobRecord,
  sortByCreatedAtDesc,
  withApplicantRecord,
  withJobRecord,
  withUserRecord,
} from "./utils.js";

export class MemoryRepository implements Repository {
  public readonly kind = "memory" as const;

  private jobs = new Map<string, JobRecord>();
  private applicants = new Map<string, ApplicantRecord>();
  private screenings = new Map<string, ScreeningResultRecord>();
  private users = new Map<string, StoredUserRecord>();

  async listJobs(): Promise<JobRecord[]> {
    return sortByCreatedAtDesc(
      Array.from(this.jobs.values()).map((item) => structuredClone(item))
    );
  }

  async getJob(jobId: string): Promise<JobRecord | null> {
    const job = this.jobs.get(jobId);
    return job ? structuredClone(job) : null;
  }

  async createJob(input: CreateJobInput): Promise<JobRecord> {
    const job = withJobRecord(input);
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
    inputs: CreateApplicantInput[]
  ): Promise<ApplicantRecord[]> {
    const created = inputs.map((input) => withApplicantRecord(jobId, input));

    created.forEach((record) => {
      this.applicants.set(record.id, record);
    });

    return created.map((item) => structuredClone(item));
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

  async getDashboardSummary(): Promise<DashboardSummary> {
    return {
      totalJobs: this.jobs.size,
      totalApplicants: this.applicants.size,
      screenedApplicants: this.screenings.size,
      averageMatchScore: computeAverageMatchScore([
        ...this.screenings.values(),
      ]),
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

  async seedIfEmpty(seed: {
    jobs: JobRecord[];
    applicants: ApplicantRecord[];
    screenings: ScreeningResultRecord[];
  }): Promise<void> {
    if (this.jobs.size > 0) {
      return;
    }

    seed.jobs.forEach((job) => {
      this.jobs.set(job.id, structuredClone(job));
    });

    seed.applicants.forEach((applicant) => {
      this.applicants.set(applicant.id, structuredClone(applicant));
    });

    seed.screenings.forEach((screening) => {
      this.screenings.set(screening.id, structuredClone(screening));
    });
  }
}
