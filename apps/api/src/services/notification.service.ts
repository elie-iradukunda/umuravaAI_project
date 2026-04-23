import type {
  ApplicantRecord,
  JobRecord,
  NotificationRecord,
  NotificationsResponse,
  ScreeningResultRecord,
  StoredUserRecord,
} from "@umurava/shared";

import { env } from "../config/env.js";
import type { Repository } from "../repositories/types.js";
import { isGeminiConfigured } from "./gemini.service.js";

type NotificationDraft = Omit<NotificationRecord, "isRead" | "readAt">;

const shortlistedDecisionIds = new Set(["shortlist", "strong-shortlist"]);

const sortNotifications = (items: NotificationDraft[]): NotificationDraft[] =>
  [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const startCase = (value: string): string =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");

const formatScore = (value: number): string => `${Math.round(value)}%`;

const buildTalentNotificationDrafts = async (
  repository: Repository,
  currentUser: StoredUserRecord
): Promise<NotificationDraft[]> => {
  const applicants = await repository.listApplicantsBySubmittedUser(currentUser.id);

  const applications = (
    await Promise.all(
      applicants.map(async (applicant) => {
        const job = await repository.getJob(applicant.jobId);

        if (!job) {
          return null;
        }

        const screenings = await repository.listScreenings(job.id);
        return {
          applicant,
          job,
          screening:
            screenings.find((item) => item.applicantId === applicant.id) ?? null,
        };
      })
    )
  ).filter(
    (
      item
    ): item is {
      applicant: ApplicantRecord;
      job: JobRecord;
      screening: ScreeningResultRecord | null;
    } => Boolean(item)
  );

  const appliedJobIds = new Set(applications.map((item) => item.job.id));
  const availableJobs = (await repository.listJobs())
    .filter((job) => !appliedJobIds.has(job.id))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )
    .slice(0, 4);

  const items: NotificationDraft[] = [];

  applications.forEach(({ applicant, job, screening }) => {
    items.push({
      id: `talent-application-${applicant.id}`,
      title: `Application submitted for ${job.title}`,
      message:
        "Your profile is now attached to this job and ready for review or AI screening.",
      href: "/talent/applications",
      actionLabel: "Track status",
      createdAt: applicant.createdAt,
      badge: "Applied",
      tone: "info",
    });

    if (!screening) {
      return;
    }

    const decisionLabel = screening.decision
      ? startCase(screening.decision)
      : "Screening Update";
    const isShortlisted =
      screening.decision != null &&
      shortlistedDecisionIds.has(screening.decision);

    items.push({
      id: `talent-screening-${applicant.id}`,
      title: isShortlisted
        ? `Shortlisted for ${job.title}`
        : `${decisionLabel} for ${job.title}`,
      message: isShortlisted
        ? `AI screening scored your application at ${formatScore(
            screening.matchScore
          )} and moved it onto the shortlist.`
        : `AI screening reviewed your application with a ${formatScore(
            screening.matchScore
          )} fit score. Open your applications to review the latest status.`,
      href: "/talent/applications",
      actionLabel: "View application",
      createdAt: screening.createdAt,
      badge: isShortlisted ? "Shortlisted" : decisionLabel,
      tone: isShortlisted ? "success" : "warning",
    });
  });

  availableJobs.forEach((job) => {
    items.push({
      id: `talent-job-${job.id}`,
      title: `New job posted: ${job.title}`,
      message: `${job.department} in ${job.location} is open for applications right now.`,
      href: `/talent/jobs/${job.id}`,
      actionLabel: "Open job",
      createdAt: job.updatedAt,
      badge: "New job",
      tone: "info",
    });
  });

  return sortNotifications(items).slice(0, 16);
};

const buildJobOwnerNotificationDrafts = async (
  repository: Repository,
  currentUser: StoredUserRecord
): Promise<NotificationDraft[]> => {
  const jobs = await repository.listJobs({ ownerUserId: currentUser.id });
  const items: NotificationDraft[] = [];

  await Promise.all(
    jobs.map(async (job) => {
      const [applicants, screenings] = await Promise.all([
        repository.listApplicants(job.id),
        repository.listScreenings(job.id),
      ]);

      applicants.forEach((applicant) => {
        items.push({
          id: `owner-applicant-${applicant.id}`,
          title: `New applicant for ${job.title}`,
          message: `${applicant.fullName} is ready for review in your hiring workspace.`,
          href: `/jobs/${job.id}#applicants`,
          actionLabel: "Open applicants",
          createdAt: applicant.createdAt,
          badge: "Applicant",
          tone: "info",
        });
      });

      if (screenings.length > 0) {
        items.push({
          id: `owner-screening-${job.id}`,
          title: `AI screening ready for ${job.title}`,
          message: `${screenings.length} ranked candidate result${
            screenings.length === 1 ? "" : "s"
          } are ready in the shortlist view.`,
          href: `/jobs/${job.id}#shortlist`,
          actionLabel: "View shortlist",
          createdAt: screenings[0]?.createdAt ?? job.updatedAt,
          badge: "Shortlist",
          tone: "success",
        });
      } else if (applicants.length === 0) {
        items.push({
          id: `owner-needs-applicants-${job.id}`,
          title: `${job.title} needs applicants`,
          message:
            "This role is live, but the pipeline is still empty and not ready for screening.",
          href: `/jobs/${job.id}`,
          actionLabel: "Open job",
          createdAt: job.updatedAt,
          badge: "Needs attention",
          tone: "warning",
        });
      }
    })
  );

  return sortNotifications(items).slice(0, 16);
};

const buildAdminNotificationDrafts = async (
  repository: Repository,
  currentUser: StoredUserRecord
): Promise<NotificationDraft[]> => {
  const jobs = await repository.listJobs();
  const [applicants, aiEnabled] = await Promise.all([
    Promise.all(jobs.map((job) => repository.listApplicants(job.id))),
    Promise.resolve(isGeminiConfigured()),
  ]);

  const totalApplicants = applicants.reduce(
    (sum, current) => sum + current.length,
    0
  );

  return sortNotifications([
    {
      id: `admin-ai-${env.SCREENING_PROVIDER}-${aiEnabled ? "ready" : "setup"}`,
      title: aiEnabled ? "AI screening is ready" : "AI screening needs setup",
      message: aiEnabled
        ? `${startCase(env.SCREENING_PROVIDER)} is configured and available for job-owner shortlisting.`
        : "The screening provider is configured, but the required API credentials are still missing.",
      href: "/workspace#ai-readiness",
      actionLabel: "Review AI controls",
      createdAt: currentUser.updatedAt,
      badge: aiEnabled ? "AI ready" : "Needs setup",
      tone: aiEnabled ? "success" : "warning",
    },
    {
      id: `admin-storage-${repository.kind}`,
      title:
        repository.kind === "mongo"
          ? "Mongo persistence is active"
          : "Memory mode is active",
      message:
        repository.kind === "mongo"
          ? "Platform data can persist across restarts for multi-session use."
          : "Data resets when the API restarts, so this environment is not yet persistent.",
      href: "/workspace#system-status",
      actionLabel: "Open system status",
      createdAt: currentUser.updatedAt,
      badge: repository.kind === "mongo" ? "Persistent" : "Ephemeral",
      tone: repository.kind === "mongo" ? "success" : "warning",
    },
    {
      id: `admin-platform-load-${jobs.length}-${totalApplicants}`,
      title: "Current platform activity",
      message: `${jobs.length} active job${
        jobs.length === 1 ? "" : "s"
      } and ${totalApplicants} applicant${
        totalApplicants === 1 ? "" : "s"
      } are currently stored on the platform.`,
      href: "/workspace#signals",
      actionLabel: "View signals",
      createdAt: currentUser.updatedAt,
      badge: "Platform",
      tone: "info",
    },
  ]);
};

const buildNotificationDrafts = async (
  repository: Repository,
  currentUser: StoredUserRecord
): Promise<NotificationDraft[]> => {
  if (currentUser.roleId === "talent") {
    return buildTalentNotificationDrafts(repository, currentUser);
  }

  if (currentUser.roleId === "admin") {
    return buildAdminNotificationDrafts(repository, currentUser);
  }

  return buildJobOwnerNotificationDrafts(repository, currentUser);
};

export const getNotifications = async (
  repository: Repository,
  currentUser: StoredUserRecord
): Promise<NotificationsResponse> => {
  const [drafts, reads] = await Promise.all([
    buildNotificationDrafts(repository, currentUser),
    repository.listNotificationReadsByUserId(currentUser.id),
  ]);

  const readsByNotificationId = new Map(
    reads.map((item) => [item.notificationId, item])
  );
  const notifications = drafts.map((item) => {
    const read = readsByNotificationId.get(item.id);

    return {
      ...item,
      isRead: Boolean(read),
      readAt: read?.readAt ?? null,
    };
  });

  const readCount = notifications.filter((item) => item.isRead).length;

  return {
    notifications,
    summary: {
      total: notifications.length,
      read: readCount,
      unread: notifications.length - readCount,
    },
  };
};

export const markNotificationsAsRead = async (
  repository: Repository,
  currentUser: StoredUserRecord,
  notificationIds: string[]
): Promise<NotificationsResponse> => {
  const current = await getNotifications(repository, currentUser);
  const validIds = new Set(current.notifications.map((item) => item.id));
  const idsToMark = [...new Set(notificationIds)].filter((item) =>
    validIds.has(item)
  );

  if (idsToMark.length === 0) {
    return current;
  }

  await repository.markNotificationsRead(currentUser.id, idsToMark);
  return getNotifications(repository, currentUser);
};
