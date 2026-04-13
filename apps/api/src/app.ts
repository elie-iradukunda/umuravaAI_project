import cors from "cors";
import express from "express";
import multer from "multer";
import {
  createUserInputSchema,
  createApplicantInputSchema,
  createJobInputSchema,
  loginInputSchema,
  updateJobInputSchema,
} from "@umurava/shared";
import { ZodError } from "zod";

import { env } from "./config/env.js";
import { HttpError } from "./lib/http-error.js";
import type { Repository } from "./repositories/types.js";
import { authenticateUser, registerUser } from "./services/auth.service.js";
import { buildDashboardResponse } from "./services/dashboard.service.js";
import { getJobDetail } from "./services/job.service.js";
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
      response.json(await buildDashboardResponse(repository));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/talent-applications", async (request, response, next) => {
    try {
      const email = String(request.query.email ?? "").trim();
      const fullName = String(request.query.fullName ?? "").trim();

      if (!email && !fullName) {
        response.status(400).json({
          message: "An email or full name query is required.",
        });
        return;
      }

      response.json(
        await getTalentApplications(repository, {
          email,
          fullName,
        })
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs", async (_request, response, next) => {
    try {
      response.json({
        jobs: await repository.listJobs(),
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
      const input = createJobInputSchema.parse(request.body);
      const job = await repository.createJob(input);
      response.status(201).json({ job });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:jobId", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
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
      const jobId = String(request.params.jobId);
      const input = updateJobInputSchema.parse(request.body);
      const job = await repository.updateJob(jobId, input);

      if (!job) {
        response.status(404).json({ message: "Job not found." });
        return;
      }

      response.json({ job });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:jobId/applicants", async (request, response, next) => {
    try {
      const jobId = String(request.params.jobId);
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
      const payload = Array.isArray(request.body) ? request.body : [request.body];
      const applicants = payload.map((item) =>
        createApplicantInputSchema.parse(item)
      );

      const created = await repository.createApplicants(jobId, applicants);

      response.status(201).json({
        applicants: created,
        importedCount: created.length,
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
        const files = (request.files as Express.Multer.File[]) ?? [];
        const parsed = await parseApplicantUploads(files);
        const validatedApplicants = parsed.applicants.map((item) =>
          createApplicantInputSchema.parse(item)
        );
        const applicants = await repository.createApplicants(jobId, validatedApplicants);

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
