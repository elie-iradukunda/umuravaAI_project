import type { DashboardJobSnapshot, DashboardResponse } from "@umurava/shared";

import type { Repository } from "../repositories/types.js";

export const buildDashboardResponse = async (
  repository: Repository
): Promise<DashboardResponse> => {
  const [summary, jobs] = await Promise.all([
    repository.getDashboardSummary(),
    repository.listJobs(),
  ]);

  const jobSnapshots = await Promise.all(
    jobs.map(async (job): Promise<DashboardJobSnapshot> => {
      const [applicants, screenings] = await Promise.all([
        repository.listApplicants(job.id),
        repository.listScreenings(job.id),
      ]);

      return {
        job,
        applicantCount: applicants.length,
        shortlistCount: screenings.length,
        topMatchScore: screenings[0]?.matchScore ?? null,
      };
    })
  );

  return {
    summary,
    jobs: jobSnapshots,
  };
};
