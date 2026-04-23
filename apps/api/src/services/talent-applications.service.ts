import type {
  ApplicantRecord,
  ScreeningResultRecord,
  TalentApplicationRecord,
  TalentApplicationsResponse,
} from "@umurava/shared";

import type { Repository } from "../repositories/types.js";

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
  talentUserId: string
): Promise<TalentApplicationsResponse> => {
  const applicants = await repository.listApplicantsBySubmittedUser(talentUserId);

  const applications = (
    await Promise.all(
      applicants.map(async (applicant) => {
        const job = await repository.getJob(applicant.jobId);
        if (!job) {
          return null;
        }

        const screenings = await repository.listScreenings(job.id);
        return mapApplication(applicant, screenings, job);
      })
    )
  )
    .filter((item): item is TalentApplicationRecord => Boolean(item))
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
    );

  return { applications };
};
