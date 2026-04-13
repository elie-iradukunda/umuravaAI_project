import type {
  ApplicantRecord,
  ScreeningResultRecord,
  TalentApplicationRecord,
  TalentApplicationsResponse,
} from "@umurava/shared";

import type { Repository } from "../repositories/types.js";

const matchesTalentIdentity = (
  applicant: ApplicantRecord,
  email?: string,
  fullName?: string
) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedName = fullName?.trim().toLowerCase();

  // For platform talent accounts, email is the strongest identity signal.
  // Only fall back to full name when no email was supplied.
  if (normalizedEmail) {
    return (applicant.email ?? "").trim().toLowerCase() === normalizedEmail;
  }

  if (normalizedName) {
    return applicant.fullName.trim().toLowerCase() === normalizedName;
  }

  return false;
};

const mapApplication = (
  applicant: ApplicantRecord,
  screenings: ScreeningResultRecord[],
  job: TalentApplicationRecord["job"]
): TalentApplicationRecord => ({
  applicationId: applicant.id,
  submittedAt: applicant.createdAt,
  job,
  applicant,
  screening:
    screenings.find((screening) => screening.applicantId === applicant.id) ?? null,
});

export const getTalentApplications = async (
  repository: Repository,
  identity: {
    email?: string;
    fullName?: string;
  }
): Promise<TalentApplicationsResponse> => {
  const jobs = await repository.listJobs();

  const jobArtifacts = await Promise.all(
    jobs.map(async (job) => {
      const [applicants, screenings] = await Promise.all([
        repository.listApplicants(job.id),
        repository.listScreenings(job.id),
      ]);

      return { job, applicants, screenings };
    })
  );

  const applications = jobArtifacts
    .flatMap(({ job, applicants, screenings }) =>
      applicants
        .filter(
          (applicant) =>
            applicant.source === "platform" &&
            matchesTalentIdentity(applicant, identity.email, identity.fullName)
        )
        .map((applicant) => mapApplication(applicant, screenings, job))
    )
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    );

  return { applications };
};
