import type {
  DashboardJobSnapshot,
  DashboardResponse,
  StoredUserRecord,
} from "@umurava/shared";

import { env } from "../config/env.js";
import type { Repository } from "../repositories/types.js";
import { isGeminiConfigured } from "./gemini.service.js";

export const buildDashboardResponse = async (
  repository: Repository,
  currentUser: StoredUserRecord
): Promise<DashboardResponse> => {
  const jobFilters =
    currentUser.roleId === "job-owner"
      ? { ownerUserId: currentUser.id }
      : undefined;

  const [summary, jobs] = await Promise.all([
    currentUser.roleId === "talent"
      ? Promise.resolve({
          totalJobs: 0,
          totalApplicants: 0,
          screenedApplicants: 0,
          averageMatchScore: 0,
        })
      : currentUser.roleId === "job-owner"
      ? repository.getDashboardSummary({ ownerUserId: currentUser.id })
      : repository.getDashboardSummary(),
    repository.listJobs(jobFilters),
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
    platform: {
      repository: repository.kind,
      screeningProvider: env.SCREENING_PROVIDER,
      aiEnabled: isGeminiConfigured(),
      ingestionChannels: ["Structured Form", "CSV", "Excel", "PDF"],
    },
  };
};
