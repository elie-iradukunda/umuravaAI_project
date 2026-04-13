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

export type CreateStoredUserInput = Pick<
  StoredUserRecord,
  "name" | "email" | "passwordHash" | "roleId" | "location"
>;

export interface Repository {
  kind: "memory" | "mongo";
  listJobs(): Promise<JobRecord[]>;
  getJob(jobId: string): Promise<JobRecord | null>;
  createJob(input: CreateJobInput): Promise<JobRecord>;
  updateJob(jobId: string, input: UpdateJobInput): Promise<JobRecord | null>;
  listApplicants(jobId: string): Promise<ApplicantRecord[]>;
  createApplicants(
    jobId: string,
    inputs: CreateApplicantInput[]
  ): Promise<ApplicantRecord[]>;
  markApplicantsScreened(jobId: string): Promise<void>;
  listScreenings(jobId: string): Promise<ScreeningResultRecord[]>;
  replaceScreenings(
    jobId: string,
    screenings: ScreeningResultRecord[]
  ): Promise<ScreeningResultRecord[]>;
  getDashboardSummary(): Promise<DashboardSummary>;
  getUserById(userId: string): Promise<StoredUserRecord | null>;
  getUserByEmail(email: string): Promise<StoredUserRecord | null>;
  createUser(input: CreateStoredUserInput): Promise<StoredUserRecord>;
  seedIfEmpty(seed: {
    jobs: JobRecord[];
    applicants: ApplicantRecord[];
    screenings: ScreeningResultRecord[];
  }): Promise<void>;
}
