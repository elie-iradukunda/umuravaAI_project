import type { JobDetailResponse } from "@umurava/shared";

import type { Repository } from "../repositories/types.js";
import { buildScreeningOverview } from "./screening.service.js";

export const getJobDetail = async (
  repository: Repository,
  jobId: string
): Promise<JobDetailResponse | null> => {
  const job = await repository.getJob(jobId);

  if (!job) {
    return null;
  }

  const [applicants, screenings] = await Promise.all([
    repository.listApplicants(jobId),
    repository.listScreenings(jobId),
  ]);

  return {
    job,
    applicants,
    screenings,
    screeningOverview: buildScreeningOverview(job, applicants, screenings),
  };
};
