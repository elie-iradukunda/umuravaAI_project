import { randomUUID } from "node:crypto";

import type {
  ApplicantRecord,
  CreateApplicantInput,
  CreateJobInput,
  JobRecord,
  NotificationReadRecord,
  UserRole,
  ScreeningResultRecord,
  StoredUserRecord,
  TalentProfileRecord,
  UpdateJobInput,
} from "@umurava/shared";
import { normalizeUserRole } from "@umurava/shared";

export const nowIso = () => new Date().toISOString();

export const withJobRecord = (
  ownerUserId: string,
  input: CreateJobInput,
  overrides: Partial<JobRecord> = {}
): JobRecord => {
  const timestamp = overrides.createdAt ?? nowIso();

  return {
    id: overrides.id ?? `job_${randomUUID()}`,
    ownerUserId: overrides.ownerUserId ?? ownerUserId,
    ...input,
    createdAt: timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
  };
};

export const mergeJobRecord = (
  current: JobRecord,
  input: UpdateJobInput
): JobRecord => ({
  ...current,
  ...input,
  updatedAt: nowIso(),
});

export const withApplicantRecord = (
  jobId: string,
  input: CreateApplicantInput,
  overrides: Partial<ApplicantRecord> = {}
): ApplicantRecord => {
  const timestamp = overrides.createdAt ?? nowIso();

  return {
    id: overrides.id ?? `applicant_${randomUUID()}`,
    jobId,
    submittedByUserId: overrides.submittedByUserId ?? null,
    fullName: input.fullName,
    headline: input.headline ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    location: input.location,
    source: input.source ?? "manual",
    resumeUrl: input.resumeUrl ?? "",
    resumeFileName: input.resumeFileName ?? "",
    resumeText: input.resumeText ?? "",
    profileSummary: input.profileSummary,
    totalExperienceYears: input.totalExperienceYears,
    education: input.education ?? [],
    skills: input.skills ?? [],
    languages: input.languages ?? [],
    experience: input.experience ?? [],
    certifications: input.certifications ?? [],
    projects: input.projects ?? [],
    availability: input.availability,
    socialLinks: input.socialLinks ?? {},
    tags: input.tags ?? [],
    screeningStatus: overrides.screeningStatus ?? "ready",
    createdAt: timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
  };
};

export const withUserRecord = (
  input: Pick<
    StoredUserRecord,
    "name" | "email" | "passwordHash" | "roleId" | "location"
  >,
  overrides: Partial<StoredUserRecord> = {}
): StoredUserRecord => {
  const timestamp = overrides.createdAt ?? nowIso();

  return {
    id: overrides.id ?? `user_${randomUUID()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    roleId: normalizeUserRole(input.roleId) as UserRole,
    location: input.location.trim(),
    createdAt: timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
  };
};

export const withTalentProfileRecord = (
  userId: string,
  input: CreateApplicantInput,
  overrides: Partial<TalentProfileRecord> = {}
): TalentProfileRecord => {
  const timestamp = overrides.createdAt ?? nowIso();

  return {
    id: overrides.id ?? `talent_profile_${userId}`,
    userId,
    fullName: input.fullName,
    headline: input.headline ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    location: input.location,
    source: input.source ?? "platform",
    resumeUrl: input.resumeUrl ?? "",
    resumeFileName: input.resumeFileName ?? "",
    resumeText: input.resumeText ?? "",
    profileSummary: input.profileSummary,
    totalExperienceYears: input.totalExperienceYears,
    education: input.education ?? [],
    skills: input.skills ?? [],
    languages: input.languages ?? [],
    experience: input.experience ?? [],
    certifications: input.certifications ?? [],
    projects: input.projects ?? [],
    availability: input.availability,
    socialLinks: input.socialLinks ?? {},
    tags: input.tags ?? [],
    createdAt: timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
  };
};

export const withNotificationReadRecord = (
  userId: string,
  notificationId: string,
  overrides: Partial<NotificationReadRecord> = {}
): NotificationReadRecord => {
  const timestamp = overrides.readAt ?? nowIso();

  return {
    id: overrides.id ?? `notification_read_${randomUUID()}`,
    userId,
    notificationId,
    readAt: timestamp,
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
  };
};

export const markApplicantAsScreened = (
  applicant: ApplicantRecord
): ApplicantRecord => ({
  ...applicant,
  screeningStatus: "screened",
  updatedAt: nowIso(),
});

export const markApplicantAsReady = (
  applicant: ApplicantRecord
): ApplicantRecord => ({
  ...applicant,
  screeningStatus: "ready",
  updatedAt: nowIso(),
});

export const sortByCreatedAtDesc = <
  T extends { createdAt: string; updatedAt?: string }
>(
  items: T[]
): T[] =>
  [...items].sort((left, right) => {
    const leftValue = new Date(left.updatedAt ?? left.createdAt).getTime();
    const rightValue = new Date(right.updatedAt ?? right.createdAt).getTime();
    return rightValue - leftValue;
  });

export const computeAverageMatchScore = (
  screenings: ScreeningResultRecord[]
): number => {
  if (screenings.length === 0) {
    return 0;
  }

  const total = screenings.reduce((sum, current) => sum + current.matchScore, 0);
  return Number((total / screenings.length).toFixed(1));
};
