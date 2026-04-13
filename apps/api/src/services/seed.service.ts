import { demoApplicants, demoJob, demoScreenings } from "@umurava/shared";

import type { Repository } from "../repositories/types.js";

export const seedDemoData = async (repository: Repository): Promise<void> => {
  await repository.seedIfEmpty({
    jobs: [demoJob],
    applicants: demoApplicants,
    screenings: demoScreenings,
  });
};
