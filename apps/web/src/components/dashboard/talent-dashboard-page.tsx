"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  DashboardJobSnapshot,
  TalentApplicationRecord,
} from "@umurava/shared";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  Compass,
  FilePenLine,
  Sparkles,
} from "lucide-react";

import { api } from "../../lib/api";
import type { DemoUser } from "../../lib/demo-users";
import { formatDate, formatScore, startCase } from "../../lib/format";
import { buildTalentJobSuggestions } from "../../lib/talent-job-match";
import {
  buildTalentProfileDefaults,
  estimateTalentProfileCompletion,
  loadTalentProfileDraft,
  type TalentProfileValues,
} from "../../lib/talent-profile";

type TalentDashboardPageProps = {
  currentUser: DemoUser;
  jobs: DashboardJobSnapshot[];
};

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

type TalentNotification = {
  id: string;
  title: string;
  message: string;
  href: string;
  actionLabel: string;
  createdAt: string;
  badge: string;
  tone: "info" | "success" | "suggestion";
};

const shortlistedDecisionIds = new Set(["shortlist", "strong-shortlist"]);

const notificationToneStyles: Record<TalentNotification["tone"], string> = {
  info: "border-[#dbe7ff] bg-[#f8fbff] text-[#2559b8]",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  suggestion: "border-[#f7e7b6] bg-[#fffdf5] text-[#a97800]",
};

export const TalentDashboardPage = ({
  currentUser,
  jobs,
}: TalentDashboardPageProps) => {
  const [profileDraft, setProfileDraft] = useState<TalentProfileValues>(() =>
    buildTalentProfileDefaults(currentUser)
  );
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [savedSkillCount, setSavedSkillCount] = useState(0);
  const [savedExperienceCount, setSavedExperienceCount] = useState(0);
  const [applications, setApplications] = useState<TalentApplicationRecord[]>([]);
  const [applicationsStatus, setApplicationsStatus] = useState<LoadStatus>("idle");
  const [applicationsError, setApplicationsError] = useState("");

  useEffect(() => {
    const draft = loadTalentProfileDraft(currentUser);
    setProfileDraft(draft);
    setProfileCompletion(estimateTalentProfileCompletion(draft));
    setSavedSkillCount(draft.skills.filter((item) => item.name.trim()).length);
    setSavedExperienceCount(
      draft.experience.filter(
        (item) => item.company.trim() || item.role.trim()
      ).length
    );
  }, [currentUser]);

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      setApplicationsStatus("loading");
      setApplicationsError("");

      try {
        const response = await api.getTalentApplications(
          currentUser.email,
          currentUser.name
        );

        if (!active) {
          return;
        }

        setApplications(response.applications);
        setApplicationsStatus("succeeded");
      } catch (error) {
        if (!active) {
          return;
        }

        setApplicationsStatus("failed");
        setApplicationsError(
          error instanceof Error
            ? error.message
            : "Could not load your talent notifications."
        );
      }
    };

    void loadApplications();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const appliedJobIds = useMemo(
    () => new Set(applications.map((application) => application.job.id)),
    [applications]
  );

  const suggestions = useMemo(
    () =>
      buildTalentJobSuggestions(profileDraft, jobs).map((item) => ({
        ...item,
        application:
          applications.find(
            (application) => application.job.id === item.snapshot.job.id
          ) ?? null,
        isApplied: appliedJobIds.has(item.snapshot.job.id),
      })),
    [appliedJobIds, applications, jobs, profileDraft]
  );

  const suggestedJobs = useMemo(() => {
    const strongMatches = suggestions.filter(
      (item) => item.suggestion.matchScore >= 45
    );

    return (strongMatches.length > 0 ? strongMatches : suggestions).slice(0, 4);
  }, [suggestions]);

  const latestOpportunityAlerts = useMemo(
    () =>
      [...jobs]
        .filter((snapshot) => !appliedJobIds.has(snapshot.job.id))
        .sort(
          (left, right) =>
            new Date(right.job.updatedAt).getTime() -
            new Date(left.job.updatedAt).getTime()
        )
        .slice(0, 4),
    [appliedJobIds, jobs]
  );

  const shortlistAlerts = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.screening?.decision &&
          shortlistedDecisionIds.has(application.screening.decision)
      ),
    [applications]
  );

  const notifications = useMemo(() => {
    const items: TalentNotification[] = [];

    applications.forEach((application) => {
      if (
        application.screening?.decision &&
        shortlistedDecisionIds.has(application.screening.decision)
      ) {
        items.push({
          id: `shortlist-${application.applicationId}`,
          title: `Shortlisted for ${application.job.title}`,
          message: `Your application is on the shortlist with ${formatScore(
            application.screening.matchScore
          )} fit. Open your applications to review the latest AI signal.`,
          href: "/talent/applications",
          actionLabel: "View application",
          createdAt:
            application.screening.createdAt || application.submittedAt,
          badge: "Shortlisted",
          tone: "success",
        });
        return;
      }

      items.push({
        id: `application-${application.applicationId}`,
        title: `Application submitted for ${application.job.title}`,
        message:
          "Your profile is now in the job-owner workspace and ready for review or AI screening.",
        href: "/talent/applications",
        actionLabel: "Track status",
        createdAt: application.submittedAt,
        badge: "Applied",
        tone: "info",
      });
    });

    suggestions
      .filter((item) => !item.isApplied)
      .slice(0, 2)
      .forEach((item) => {
        items.push({
          id: `suggested-${item.snapshot.job.id}`,
          title: `Suggested role: ${item.snapshot.job.title}`,
          message:
            item.suggestion.matchedSkills.length > 0
              ? `Matched skills: ${item.suggestion.matchedSkills
                  .slice(0, 3)
                  .join(", ")}.`
              : "This job aligns with your profile summary, experience, and CV details.",
          href: `/talent/jobs/${item.snapshot.job.id}/apply`,
          actionLabel: "Apply now",
          createdAt: item.snapshot.job.updatedAt,
          badge: "Suggested",
          tone: "suggestion",
        });
      });

    latestOpportunityAlerts.slice(0, 2).forEach((snapshot) => {
      items.push({
        id: `new-job-${snapshot.job.id}`,
        title: `New job posted: ${snapshot.job.title}`,
        message: `${snapshot.job.department} in ${snapshot.job.location} is live and ready for applications.`,
        href: `/talent/jobs/${snapshot.job.id}`,
        actionLabel: "Open job",
        createdAt: snapshot.job.updatedAt,
        badge: "New job",
        tone: "info",
      });
    });

    return items
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      )
      .slice(0, 6);
  }, [applications, latestOpportunityAlerts, suggestions]);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-[#06366d] via-[#135f9b] to-[#6ac5d9] p-6 text-white shadow-[0_30px_80px_rgba(6,54,109,0.28)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">
            Talent Workspace
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Keep one strong profile ready, then apply in a single flow.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
            Your profile and CV now power job suggestions, talent notifications,
            and the same job-owner screening flow used after you apply.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Open roles</p>
              <p className="mt-3 text-3xl font-semibold text-white">{jobs.length}</p>
            </article>
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Saved skills</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {savedSkillCount}
              </p>
            </article>
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Profile completion</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {profileCompletion}%
              </p>
            </article>
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Dashboard alerts</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {notifications.length}
              </p>
            </article>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/talent/profile"
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#06366d] transition hover:bg-[#eaf6fb]"
            >
              Complete Profile
            </Link>
            <Link
              href="/talent/jobs"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Browse Jobs
            </Link>
            <Link
              href="/talent/applications"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              My Applications
            </Link>
          </div>
        </div>

        <aside className="panel scroll-mt-28 p-6" id="notifications">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <p className="kicker">Talent Notifications</p>
              <h3 className="section-title mt-2">Application and job alerts</h3>
            </div>
          </div>

          <p className="section-copy mt-4">
            The dashboard now highlights submitted applications, shortlist updates,
            newly posted jobs, and profile-based role suggestions.
          </p>

          {applicationsError ? (
            <div className="status-note error mt-5">{applicationsError}</div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {applicationsStatus === "loading" && notifications.length === 0 ? (
              <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4 text-sm text-slate-600">
                Loading your notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-[22px] border p-4"
                >
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${notificationToneStyles[notification.tone]}`}
                  >
                    {notification.badge}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#10213c]">
                    {notification.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {formatDate(notification.createdAt)}
                    </p>
                    <Link
                      href={notification.href}
                      className="text-sm font-semibold text-[#2559b8] transition hover:text-[#173d82]"
                    >
                      {notification.actionLabel}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
                No alerts yet. Save your profile, upload your CV, and apply to a
                role to start receiving talent-side notifications here.
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Profile completion",
            value: `${profileCompletion}%`,
            icon: BadgeCheck,
          },
          {
            label: "Applications submitted",
            value: String(applications.length),
            icon: FilePenLine,
          },
          {
            label: "Shortlist alerts",
            value: String(shortlistAlerts.length),
            icon: Sparkles,
          },
          {
            label: "Suggested jobs",
            value: String(suggestedJobs.filter((item) => !item.isApplied).length),
            icon: Compass,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="metric-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {metric.label}
                  </p>
                  <p className="metric-number text-[2rem]">{metric.value}</p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="panel scroll-mt-28 p-6" id="suggestions">
        <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="kicker">Suggested Jobs</p>
            <h3 className="section-title mt-3">
              Best role matches from your profile and CV
            </h3>
            <p className="section-copy max-w-3xl">
              These suggestions are scored from your saved skills, experience,
              education, summary, and uploaded CV text so you can apply faster to
              stronger-fit roles.
            </p>
          </div>
          <Link href="/talent/jobs" className="button-secondary">
            See All Jobs
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {suggestedJobs.length > 0 ? (
            suggestedJobs.map((item) => (
              <article
                key={item.snapshot.job.id}
                className="rounded-[28px] border border-[#dbe7ff] bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {item.snapshot.job.department}
                    </p>
                    <h4 className="mt-3 text-xl font-semibold text-[#10213c]">
                      {item.snapshot.job.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Match
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[#0f6991]">
                      {formatScore(item.suggestion.matchScore)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {item.snapshot.job.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip">{item.snapshot.job.location}</span>
                  <span className="chip">
                    {startCase(item.snapshot.job.employmentType)}
                  </span>
                  <span className="chip">
                    {item.snapshot.job.minimumExperienceYears}+ years
                  </span>
                  {item.suggestion.matchedSkills.slice(0, 3).map((skill) => (
                    <span
                      key={`${item.snapshot.job.id}-${skill}`}
                      className="chip"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#10213c]">
                    Why this role fits
                  </p>
                  <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                    {item.suggestion.reasons.slice(0, 2).map((reason) => (
                      <p key={`${item.snapshot.job.id}-${reason}`}>{reason}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={
                      item.isApplied
                        ? "/talent/applications"
                        : `/talent/jobs/${item.snapshot.job.id}/apply`
                    }
                    className="button-primary"
                  >
                    {item.isApplied ? "View Application" : "Apply Now"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href={`/talent/jobs/${item.snapshot.job.id}`}
                    className="button-secondary"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#c9d8f5] bg-[#f8fbff] px-6 py-10 text-center lg:col-span-2">
              <p className="text-lg font-semibold text-[#10213c]">
                No job suggestions yet.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Add more skills, experience, and CV text to your profile so the
                dashboard can suggest stronger matches automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel scroll-mt-28 p-6" id="guide">
          <p className="kicker">Recent Opportunity Alerts</p>
          <h3 className="section-title mt-3">
            Newly posted jobs you can open right now
          </h3>
          <div className="mt-5 grid gap-3">
            {latestOpportunityAlerts.length > 0 ? (
              latestOpportunityAlerts.map((snapshot) => (
                <div
                  key={snapshot.job.id}
                  className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#10213c]">
                        {snapshot.job.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {snapshot.job.department} in {snapshot.job.location}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Posted {formatDate(snapshot.job.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/talent/jobs/${snapshot.job.id}`}
                        className="button-secondary"
                      >
                        Open Job
                      </Link>
                      <Link
                        href={`/talent/jobs/${snapshot.job.id}/apply`}
                        className="button-primary"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
                You already applied to the current live jobs. Keep checking the
                dashboard for fresh opportunities and new matching suggestions.
              </div>
            )}
          </div>
        </div>

        <div className="panel scroll-mt-28 p-6" id="help">
          <p className="kicker">How Suggestions Work</p>
          <h3 className="section-title mt-3">
            Why your CV and structured profile matter
          </h3>
          <div className="mt-5 grid gap-3">
            {[
              "Uploaded CV text is read together with your saved skills, experience, and summary to estimate job fit.",
              "When a job owner posts a new role, the dashboard can surface it as a new opportunity and as a suggested match.",
              "When your application becomes shortlisted, that status now appears back on the talent dashboard as a notification.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}

            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#10213c]">
                    Current saved profile signal
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {savedSkillCount} saved skills, {savedExperienceCount} experience
                    entries, {applications.length} submitted application
                    {applications.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0f6991]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
