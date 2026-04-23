import cors from "cors";
import express from "express";
import multer from "multer";
import {
  createUserInputSchema,
  createApplicantInputSchema,
  createJobInputSchema,
  loginInputSchema,
  markNotificationsReadInputSchema,
  updateJobInputSchema,
  type ApplicantRecord,
  type CreateApplicantInput,
  type StoredUserRecord,
  type UserRole,
} from "@umurava/shared";
import { ZodError } from "zod";

import { env } from "./config/env.js";
import { HttpError } from "./lib/http-error.js";
import type { Repository } from "./repositories/types.js";
import { authenticateUser, registerUser } from "./services/auth.service.js";
import { buildDashboardResponse } from "./services/dashboard.service.js";
import { getJobDetail } from "./services/job.service.js";
import {
  getNotifications,
  markNotificationsAsRead,
} from "./services/notification.service.js";
import { runScreeningForJob } from "./services/screening.service.js";
import { getTalentApplications } from "./services/talent-applications.service.js";
import {
  parseApplicantUploads,
  parseTalentResumeUpload,
} from "./services/upload-ingestion.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

const normalizeEmail = (value: string): string => value.trim().toLowerCase();
const currentUserHeaderName = "x-user-id";

const getCurrentUser = async (
  repository: Repository,
  request: express.Request
): Promise<StoredUserRecord> => {
  const userId = String(request.header(currentUserHeaderName) ?? "").trim();

  if (!userId) {
    throw new HttpError(401, "You must sign in to continue.");
  }

  const user = await repository.getUserById(userId);

  if (!user) {
    throw new HttpError(401, "Your session is no longer valid. Please sign in again.");
  }

  return user;
};

const requireRole = (
  currentUser: StoredUserRecord,
  allowedRoles: UserRole[]
): void => {
  if (!allowedRoles.includes(currentUser.roleId)) {
    throw new HttpError(403, "You do not have access to this resource.");
  }
};

const requireOwnedJob = async (
  repository: Repository,
  jobId: string,
  currentUser: StoredUserRecord
) => {
  const job = await repository.getJob(jobId);

  if (!job) {
    throw new HttpError(404, "Job not found.");
  }

  if (job.ownerUserId !== currentUser.id) {
    throw new HttpError(404, "Job not found.");
  }

  return job;
};

const getDuplicateApplicantEmails = (
  existingApplicants: ApplicantRecord[],
  incomingApplicants: CreateApplicantInput[]
): string[] => {
  const existingEmails = new Set(
    existingApplicants
      .map((applicant) => normalizeEmail(applicant.email ?? ""))
      .filter(Boolean)
  );
  const seenIncomingEmails = new Set<string>();
  const duplicates = new Set<string>();

  incomingApplicants.forEach((applicant) => {
    const email = normalizeEmail(applicant.email ?? "");
    if (!email) {
      return;
    }

    if (existingEmails.has(email) || seenIncomingEmails.has(email)) {
      duplicates.add(email);
      return;
    }

    seenIncomingEmails.add(email);
  });

  return [...duplicates];
};

export const createApp = (repository: Repository) => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: false,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      repository: repository.kind,
      provider: env.SCREENING_PROVIDER,
    });
  });

  app.get("/api/public/jobs", async (_request, response, next) => {
    try {
      response.json({
        jobs: await repository.listJobs(),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/public/jobs/:jobId", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
      const job = await repository.getJob(jobId);

      if (!job) {
        response.status(404).json({ message: "Job not found." });
        return;
      }

      response.json({ job });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/signup", async (request, response, next) => {
    try {
      const input = createUserInputSchema.parse(request.body);
      const user = await registerUser(repository, input);
      response.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (request, response, next) => {
    try {
      const input = loginInputSchema.parse(request.body);
      const user = await authenticateUser(repository, input);
      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard", async (_request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, _request);
      response.json(await buildDashboardResponse(repository, currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      response.json(await getNotifications(repository, currentUser));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications/read", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      const input = markNotificationsReadInputSchema.parse(request.body);

      response.json(
        await markNotificationsAsRead(
          repository,
          currentUser,
          input.notificationIds
        )
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/talent/profile", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["talent"]);

      response.json({
        profile: await repository.getTalentProfileByUserId(currentUser.id),
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/talent/profile", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["talent"]);

      const input = createApplicantInputSchema.parse(request.body);
      const profile = await repository.upsertTalentProfile(currentUser.id, input);

      response.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/talent-applications", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["talent"]);

      response.json(await getTalentApplications(repository, currentUser.id));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);

      response.json({
        jobs: await repository.listJobs({ ownerUserId: currentUser.id }),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/talent/resume-upload",
    upload.single("file"),
    async (request, response, next) => {
      try {
        const currentUser = await getCurrentUser(repository, request);
        requireRole(currentUser, ["talent"]);
        const file = request.file;

        if (!file) {
          response.status(400).json({
            message: "A PDF CV file is required.",
          });
          return;
        }

        response.status(201).json(await parseTalentResumeUpload(file));
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/jobs", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);

      const input = createJobInputSchema.parse(request.body);
      const job = await repository.createJob(currentUser.id, input);
      response.status(201).json({ job });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:jobId", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);

      const jobId = String(request.params.jobId);
      await requireOwnedJob(repository, jobId, currentUser);
      const detail = await getJobDetail(repository, jobId);
      if (!detail) {
        response.status(404).json({ message: "Job not found." });
        return;
      }

      response.json(detail);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/jobs/:jobId", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);

      const jobId = String(request.params.jobId);
      await requireOwnedJob(repository, jobId, currentUser);
      const input = updateJobInputSchema.parse(request.body);
      const job = await repository.updateJob(jobId, input);

      if (!job) {
        response.status(404).json({ message: "Job not found." });
        return;
      }

      await repository.resetJobScreening(jobId);

      response.json({ job });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:jobId/applicants", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);
      await requireOwnedJob(repository, jobId, currentUser);

      response.json({
        applicants: await repository.listApplicants(jobId),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/jobs/:jobId/applicants", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);
      await requireOwnedJob(repository, jobId, currentUser);

      const payload = Array.isArray(request.body) ? request.body : [request.body];
      const applicants = payload.map((item) =>
        createApplicantInputSchema.parse(item)
      );
      const existingApplicants = await repository.listApplicants(jobId);
      const duplicateEmails = getDuplicateApplicantEmails(
        existingApplicants,
        applicants
      );

      if (duplicateEmails.length > 0) {
        response.status(409).json({
          message: `Applicants with these email addresses already exist for this job: ${duplicateEmails.join(
            ", "
          )}.`,
        });
        return;
      }

      const created = await repository.createApplicants(jobId, applicants);

      if (created.length > 0) {
        await repository.resetJobScreening(jobId);
      }

      response.status(201).json({
        applicants: created,
        importedCount: created.length,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/talent/jobs/:jobId/apply", async (request, response, next) => {
    try {
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["talent"]);

      const jobId = String(request.params.jobId);
      const job = await repository.getJob(jobId);

      if (!job) {
        response.status(404).json({ message: "Job not found." });
        return;
      }

      const applicant = createApplicantInputSchema.parse(request.body);
      const existingApplicants = await repository.listApplicants(jobId);
      const duplicateApplication = existingApplicants.find(
        (item) => item.submittedByUserId === currentUser.id
      );

      if (duplicateApplication) {
        response.status(409).json({
          message: "You already applied to this job.",
        });
        return;
      }

      const duplicateEmails = getDuplicateApplicantEmails(existingApplicants, [applicant]);

      if (duplicateEmails.length > 0) {
        response.status(409).json({
          message: `Applicants with these email addresses already exist for this job: ${duplicateEmails.join(
            ", "
          )}.`,
        });
        return;
      }

      const [createdApplicant] = await repository.createApplicants(jobId, [applicant], {
        submittedByUserId: currentUser.id,
      });

      if (createdApplicant) {
        await repository.resetJobScreening(jobId);
      }

      response.status(201).json({
        applicants: createdApplicant ? [createdApplicant] : [],
        importedCount: createdApplicant ? 1 : 0,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/jobs/:jobId/applicants/upload",
    upload.array("files"),
    async (request, response, next) => {
      try {
        const jobId = String(request.params.jobId);
        const currentUser = await getCurrentUser(repository, request);
        requireRole(currentUser, ["job-owner"]);
        await requireOwnedJob(repository, jobId, currentUser);

        const files = (request.files as Express.Multer.File[]) ?? [];
        const parsed = await parseApplicantUploads(files);
        const validatedApplicants = parsed.applicants.map((item) =>
          createApplicantInputSchema.parse(item)
        );
        const existingApplicants = await repository.listApplicants(jobId);
        const duplicateEmails = getDuplicateApplicantEmails(
          existingApplicants,
          validatedApplicants
        );

        if (duplicateEmails.length > 0) {
          response.status(409).json({
            message: `Applicants with these email addresses already exist for this job: ${duplicateEmails.join(
              ", "
            )}.`,
            warnings: parsed.warnings,
          });
          return;
        }

        const applicants = await repository.createApplicants(jobId, validatedApplicants);

        if (applicants.length > 0) {
          await repository.resetJobScreening(jobId);
        }

        response.status(201).json({
          applicants,
          importedCount: applicants.length,
          warnings: parsed.warnings,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/jobs/:jobId/screenings", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);
      await requireOwnedJob(repository, jobId, currentUser);

      response.json({
        screenings: await repository.listScreenings(jobId),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/jobs/:jobId/screenings/run", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
      const currentUser = await getCurrentUser(repository, request);
      requireRole(currentUser, ["job-owner"]);
      await requireOwnedJob(repository, jobId, currentUser);

      const screenings = await runScreeningForJob(repository, jobId);

      response.status(201).json({ screenings });
    } catch (error) {
      next(error);
    }
  });

  app.use(
    (
      error: Error,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof ZodError) {
        response.status(400).json({
          message: "Validation failed.",
          issues: error.issues,
        });
        return;
      }

      if (error instanceof HttpError) {
        response.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }

      response.status(500).json({
        message: error.message || "Unexpected server error.",
      });
    }
  );

  return app;
};
