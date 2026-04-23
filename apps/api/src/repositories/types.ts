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

export type CreateStoredUserInput = Pick<
  StoredUserRecord,
  "name" | "email" | "passwordHash" | "roleId" | "location"
>;

export type ListJobsOptions = {
  ownerUserId?: string;
};

export type CreateApplicantsOptions = {
  submittedByUserId?: string | null;
};

export type DashboardSummaryOptions = {
  ownerUserId?: string;
};

export interface Repository {
  kind: "memory" | "mongo";
  listJobs(options?: ListJobsOptions): Promise<JobRecord[]>;
  getJob(jobId: string): Promise<JobRecord | null>;
  createJob(ownerUserId: string, input: CreateJobInput): Promise<JobRecord>;
  updateJob(jobId: string, input: UpdateJobInput): Promise<JobRecord | null>;
  listApplicants(jobId: string): Promise<ApplicantRecord[]>;
  createApplicants(
    jobId: string,
    inputs: CreateApplicantInput[],
    options?: CreateApplicantsOptions
  ): Promise<ApplicantRecord[]>;
  listApplicantsBySubmittedUser(userId: string): Promise<ApplicantRecord[]>;
  resetJobScreening(jobId: string): Promise<void>;
  markApplicantsScreened(jobId: string): Promise<void>;
  listScreenings(jobId: string): Promise<ScreeningResultRecord[]>;
  replaceScreenings(
    jobId: string,
    screenings: ScreeningResultRecord[]
  ): Promise<ScreeningResultRecord[]>;
  getDashboardSummary(options?: DashboardSummaryOptions): Promise<DashboardSummary>;
  getUserById(userId: string): Promise<StoredUserRecord | null>;
  getUserByEmail(email: string): Promise<StoredUserRecord | null>;
  createUser(input: CreateStoredUserInput): Promise<StoredUserRecord>;
  getTalentProfileByUserId(userId: string): Promise<TalentProfileRecord | null>;
  upsertTalentProfile(
    userId: string,
    input: CreateApplicantInput
  ): Promise<TalentProfileRecord>;
  listNotificationReadsByUserId(userId: string): Promise<NotificationReadRecord[]>;
  markNotificationsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<NotificationReadRecord[]>;
}
