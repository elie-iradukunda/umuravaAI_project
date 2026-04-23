"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type {
  DashboardJobSnapshot,
  DashboardSummary,
  PlatformStatus,
} from "@umurava/shared";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Database,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  Users,
  Workflow,
} from "lucide-react";

import { formatScore, startCase } from "../../lib/format";
import { getPlatformUserDetails } from "../../lib/platform-users";
import type { SessionUser } from "../../lib/session-user";
import { selectCurrentUser } from "../../store/auth-slice";
import { loadDashboard } from "../../store/recruiter-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { TalentDashboardPage } from "./talent-dashboard-page";

type JobOwnerMetric = {
  label: string;
  value: string;
  href: string;
  detail: string;
  icon: LucideIcon;
};

const emptySummary: DashboardSummary = {
  totalJobs: 0,
  totalApplicants: 0,
  screenedApplicants: 0,
  averageMatchScore: 0,
};

const defaultPlatform: PlatformStatus = {
  repository: "memory",
  screeningProvider: "gemini",
  aiEnabled: false,
  ingestionChannels: [],
};

const firstName = (name: string) => name.split(" ")[0] ?? name;

const getJobWorkspaceHref = (
  snapshot: DashboardJobSnapshot | null,
  section?: "applicants" | "shortlist"
) => {
  if (!snapshot) {
    return section === "shortlist" ? "/workspace#decision-center" : "/workspace#pipeline";
  }

  if (!section) {
    return `/jobs/${snapshot.job.id}`;
  }

  return `/jobs/${snapshot.job.id}#${section}`;
};

const buildJobOwnerMetrics = (
  summary: DashboardSummary,
  featuredJob: DashboardJobSnapshot | null
): JobOwnerMetric[] => [
  {
    label: "Open Jobs",
    value: String(summary.totalJobs),
    href: "/workspace#pipeline",
    detail: "Open your live hiring roles",
    icon: BriefcaseBusiness,
  },
  {
    label: "Applicants",
    value: String(summary.totalApplicants),
    href: getJobWorkspaceHref(featuredJob, "applicants"),
    detail: featuredJob
      ? `Inspect ${featuredJob.job.title} applicants`
      : "Review applicant flow",
    icon: Users,
  },
  {
    label: "AI Shortlists",
    value: String(summary.screenedApplicants),
    href: getJobWorkspaceHref(featuredJob, "shortlist"),
    detail: featuredJob
      ? `Open ${featuredJob.job.title} shortlist`
      : "Review shortlist results",
    icon: Sparkles,
  },
  {
    label: "Average Match",
    value: formatScore(summary.averageMatchScore),
    href: "/workspace#decision-center",
    detail: "Watch current shortlist quality",
    icon: BarChart3,
  },
];

const getJobHealth = (snapshot: DashboardJobSnapshot) => {
  if (snapshot.shortlistCount > 0) {
    return {
      badge: "Shortlist ready",
      accent: "bg-[#eaf1ff] text-[#2559b8]",
      message: "AI results are ready for review and candidate follow-up.",
    };
  }

  if (snapshot.applicantCount === 0) {
    return {
      badge: "Needs applicants",
      accent: "bg-[#fff7ed] text-[#c2410c]",
      message: "No applicants are attached yet, so screening cannot begin.",
    };
  }

  if (snapshot.applicantCount < snapshot.job.shortlistLimit) {
    return {
      badge: "Growing pipeline",
      accent: "bg-[#fff7ed] text-[#b45309]",
      message: "More applicants would improve shortlist confidence for this role.",
    };
  }

  return {
    badge: "Healthy pipeline",
    accent: "bg-[#ecfdf5] text-[#047857]",
    message: "Applicant volume is healthy for the next screening pass.",
  };
};

const JobOwnerDashboard = ({
  currentUser,
  summary,
  jobs,
  platform,
  dashboardStatus,
  error,
}: {
  currentUser: SessionUser;
  summary: DashboardSummary;
  jobs: DashboardJobSnapshot[];
  platform: PlatformStatus;
  dashboardStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}) => {
  const role = getPlatformUserDetails("job-owner");
  const featuredJob = useMemo(
    () =>
      [...jobs].sort(
        (left, right) =>
          (right.topMatchScore ?? 0) - (left.topMatchScore ?? 0) ||
          right.applicantCount - left.applicantCount
      )[0] ?? null,
    [jobs]
  );
  const metrics = useMemo(
    () => buildJobOwnerMetrics(summary, featuredJob),
    [featuredJob, summary]
  );
  const boardJobs = useMemo(
    () =>
      [...jobs]
        .sort(
          (left, right) =>
            new Date(right.job.updatedAt).getTime() -
            new Date(left.job.updatedAt).getTime()
        )
        .slice(0, 4),
    [jobs]
  );
  const rolesWithShortlist = jobs.filter((job) => job.shortlistCount > 0).length;
  const rolesNeedingAttention = jobs.filter(
    (job) => job.applicantCount === 0 || job.shortlistCount === 0
  ).length;
  const commonSkills = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((snapshot) =>
      snapshot.job.requiredSkills.forEach((skill) =>
        counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1)
      )
    );

    return [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 8);
  }, [jobs]);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0b2a67] via-[#1d54ad] to-[#6ba8ff] p-6 text-white shadow-[0_30px_80px_rgba(13,46,111,0.32)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#dce8ff]">
                Welcome, {firstName(currentUser.name)}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {role.dashboardTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e6f0ff] sm:text-base">
                {role.dashboardDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[role.label, currentUser.team, currentUser.location].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/[0.14] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/jobs/new" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b2a67] transition hover:bg-[#ebf2ff]">
                  Create Job
                </Link>
                <Link href="/workspace#pipeline" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  Open Hiring Workspace
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/[0.15] bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d5e5ff]">
                    Featured Role
                  </p>
                  {featuredJob ? (
                    <Link
                      href={getJobWorkspaceHref(featuredJob)}
                      className="mt-3 inline-flex text-xl font-semibold text-white transition hover:text-[#dce8ff]"
                    >
                      {featuredJob.job.title}
                    </Link>
                  ) : (
                    <p className="mt-3 text-xl font-semibold text-white">
                      No active job yet
                    </p>
                  )}
                  <p className="mt-2 text-sm leading-6 text-[#dce8ff]">
                    {featuredJob
                      ? "Open the highlighted role, review applicants, and move directly into shortlist decisions."
                      : "Create your first job to activate the hiring workspace."}
                  </p>
                </div>
                <span className="rounded-2xl bg-white/[0.15] p-3 text-white">
                  <UserRoundSearch className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  {
                    label: "Open jobs",
                    value: String(summary.totalJobs),
                    href: "/workspace#pipeline",
                    detail: "Browse live roles",
                  },
                  {
                    label: "Applicants",
                    value: String(summary.totalApplicants),
                    href: getJobWorkspaceHref(featuredJob, "applicants"),
                    detail: featuredJob
                      ? `Open ${featuredJob.job.title} candidates`
                      : "Review applicant flow",
                  },
                  {
                    label: "Shortlists",
                    value: String(summary.screenedApplicants),
                    href: getJobWorkspaceHref(featuredJob, "shortlist"),
                    detail: featuredJob
                      ? `Open ${featuredJob.job.title} shortlist`
                      : "Review shortlist output",
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 transition hover:bg-white/15"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d5e5ff]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-sm text-[#dce8ff]">{item.detail}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside
          className="scroll-mt-28 rounded-[34px] border border-[#d9e6ff] bg-white p-6 shadow-panel"
          id="decision-center"
        >
          <p className="kicker">AI Decision Center</p>
          {featuredJob ? (
            <Link
              href={getJobWorkspaceHref(featuredJob, "shortlist")}
              className="mt-3 inline-flex text-2xl font-semibold tracking-tight text-[#10213c] transition hover:text-[#2559b8]"
            >
              {featuredJob.job.title}
            </Link>
          ) : (
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10213c]">
              Screening snapshot
            </h3>
          )}

          <div className="mt-4 flex items-end justify-between gap-4 border-b border-[#e6edf9] pb-5">
            <div>
              <p className="text-sm text-slate-500">Current match quality</p>
              <p className="mt-2 text-lg font-semibold text-[#10213c]">
                {role.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Average score
              </p>
              <p className="mt-1 text-4xl font-semibold text-[#e04848]">
                {formatScore(featuredJob?.topMatchScore ?? summary.averageMatchScore)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[24px] border border-[#dce8ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-[#2559b8]">Workspace strengths</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>{summary.totalApplicants} applicants are already in your hiring flow.</li>
                <li>{rolesWithShortlist} roles already have shortlist signal available.</li>
              </ul>
            </div>

            <div className="rounded-[24px] border border-[#ffe1d6] bg-[#fff8f5] p-4">
              <p className="text-sm font-semibold text-[#d96633]">Needs attention</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>{jobs.filter((job) => job.applicantCount === 0).length} roles still need applicants.</li>
                <li>{rolesNeedingAttention} roles still need stronger shortlist coverage.</li>
              </ul>
            </div>

            <div className="rounded-[24px] border border-[#f7e7b6] bg-[#fffdf5] p-4">
              <p className="text-sm font-semibold text-[#a97800]">AI status</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {platform.aiEnabled
                  ? `${startCase(platform.screeningProvider)} is active and ready to support shortlist generation.`
                  : "AI configuration is incomplete right now. Add the required provider settings before running screening."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={getJobWorkspaceHref(featuredJob)} className="button-secondary">
                  Open Job
                </Link>
                <Link
                  href={getJobWorkspaceHref(featuredJob, "shortlist")}
                  className="button-secondary"
                >
                  View Shortlist
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="metric-card transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(37,89,184,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="metric-number">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="panel scroll-mt-28 p-6" id="pipeline">
          <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kicker">Job Workspace</p>
              <h3 className="section-title mt-3">Active roles and next hiring actions</h3>
              <p className="section-copy max-w-3xl">
                This board stays focused on your open jobs, applicant flow, and
                shortlist readiness without exposing admin-only controls.
              </p>
            </div>
            <span className="rounded-full bg-[#f5f9ff] px-4 py-2 text-sm font-medium text-[#31538e]">
              {jobs.length} active role{jobs.length === 1 ? "" : "s"}
            </span>
          </div>

          {error ? <div className="status-note error mt-5">{error}</div> : null}

          <div className="mt-6 grid gap-4">
            {dashboardStatus === "loading" && jobs.length === 0 ? (
              <div className="rounded-[28px] border border-[#d9e6ff] bg-[#f8fbff] px-6 py-10 text-center text-sm text-slate-600">
                Loading your hiring workspace...
              </div>
            ) : boardJobs.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[#c9d8f5] bg-[#f8fbff] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-[#10213c]">No roles are active yet.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Create a job and bring applicants into the platform to start screening.
                </p>
                <Link href="/jobs/new" className="button-primary mt-5">
                  Create Job
                </Link>
              </div>
            ) : (
              boardJobs.map((snapshot) => {
                const health = getJobHealth(snapshot);
                const ratio =
                  snapshot.job.shortlistLimit > 0
                    ? Math.min(
                        Math.round(
                          (snapshot.applicantCount / snapshot.job.shortlistLimit) * 100
                        ),
                        100
                      )
                    : 0;

                return (
                  <article
                    key={snapshot.job.id}
                    className="rounded-[28px] border border-[#d8e5ff] bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${health.accent}`}
                          >
                            {health.badge}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {snapshot.job.department}
                          </span>
                        </div>

                        <Link
                          href={`/jobs/${snapshot.job.id}`}
                          className="mt-4 inline-flex text-xl font-semibold text-[#10213c] transition hover:text-[#2559b8]"
                        >
                          {snapshot.job.title}
                        </Link>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="chip">{snapshot.job.location}</span>
                          <span className="chip">{startCase(snapshot.job.employmentType)}</span>
                          <span className="chip">
                            target {snapshot.job.shortlistLimit}
                          </span>
                        </div>

                        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                          {health.message}
                        </p>

                        <div className="mt-5">
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <span>Coverage progress</span>
                            <span>{ratio}%</span>
                          </div>
                          <div className="mt-2 h-3 rounded-full bg-[#edf3ff]">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-[#1f57b3] to-[#69a7ff]"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid min-w-[240px] gap-3 rounded-[24px] border border-[#d9e6ff] bg-[#f8fbff] p-4 sm:grid-cols-3 lg:grid-cols-1">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Applicants
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-[#10213c]">
                            {snapshot.applicantCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Shortlisted
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-[#10213c]">
                            {snapshot.shortlistCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Top score
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-[#10213c]">
                            {formatScore(snapshot.topMatchScore ?? 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/jobs/${snapshot.job.id}`} className="button-secondary">
                        Open Job
                      </Link>
                      <Link
                        href={`/jobs/${snapshot.job.id}#applicants`}
                        className="button-secondary"
                      >
                        View Applicants
                      </Link>
                      <Link
                        href={`/jobs/${snapshot.job.id}#shortlist`}
                        className="button-secondary"
                      >
                        View Shortlist
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <aside className="panel p-6" id="signals">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                <Workflow className="h-5 w-5" />
              </span>
              <div>
                <p className="kicker">Hiring Signals</p>
                <h3 className="text-xl font-semibold text-[#10213c]">
                  Common skill demand across your jobs
                </h3>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {commonSkills.length > 0 ? (
                commonSkills.map(([skill, count]) => (
                  <span key={skill} className="chip">
                    {skill} x{count}
                  </span>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Add jobs with required skills to build a clearer demand picture.
                </p>
              )}
            </div>
          </aside>

          <aside className="panel scroll-mt-28 p-6" id="system-readiness">
            <p className="kicker">Workspace Readiness</p>
            <h3 className="section-title mt-3">Current platform setup for hiring teams</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-[#2559b8]">Repository</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {platform.repository === "mongo"
                    ? "Mongo persistence is active for a more realistic multi-session experience."
                    : "The workspace is running in memory mode, so stored data resets when the server restarts."}
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-[#2559b8]">Ingestion channels</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {platform.ingestionChannels.length > 0
                    ? platform.ingestionChannels.join(", ")
                    : "Structured profiles, spreadsheets, and resumes are ready when configured."}
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Updated workspace view based on the current hiring role
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

const AdminDashboard = ({
  currentUser,
  summary,
  jobs,
  platform,
  dashboardStatus,
  error,
}: {
  currentUser: SessionUser;
  summary: DashboardSummary;
  jobs: DashboardJobSnapshot[];
  platform: PlatformStatus;
  dashboardStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}) => {
  const role = getPlatformUserDetails("admin");
  const activeRoles = useMemo(
    () =>
      [...jobs]
        .sort(
          (left, right) =>
            new Date(right.job.updatedAt).getTime() -
            new Date(left.job.updatedAt).getTime()
        )
        .slice(0, 4),
    [jobs]
  );
  const systemCards = [
    {
      label: "Live Jobs",
      value: String(summary.totalJobs),
      detail: "All active roles currently stored on the platform",
      icon: BriefcaseBusiness,
    },
    {
      label: "Applicants",
      value: String(summary.totalApplicants),
      detail: "Total applicants across all job-owner workspaces",
      icon: Users,
    },
    {
      label: "Screened",
      value: String(summary.screenedApplicants),
      detail: "Ranked shortlist results currently generated",
      icon: Sparkles,
    },
    {
      label: "AI Provider",
      value: startCase(platform.screeningProvider),
      detail: platform.aiEnabled
        ? "Gemini credentials are configured for screening runs"
        : "Provider configuration still needs attention",
      icon: BrainCircuit,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-[#191a65] via-[#2f44a9] to-[#8b8bff] p-6 text-white shadow-[0_30px_80px_rgba(30,36,110,0.28)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#dddfff]">
              Welcome, {firstName(currentUser.name)}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {role.dashboardTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#eff1ff] sm:text-base">
              {role.dashboardDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[role.label, currentUser.team, currentUser.location].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/[0.14] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workspace#system-status" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#202472] transition hover:bg-[#f0f2ff]">
                Open System Status
              </Link>
              <Link href="/workspace#ai-readiness" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                Review AI Controls
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.15] bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e2e4ff]">
              Admin Scope
            </p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Separate from hiring workspaces
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#e6e9ff]">
              This dashboard intentionally excludes job-owner applicant data and
              talent application detail. Admin accounts stay focused on system
              status, AI readiness, and platform trust.
            </p>
            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/10 p-4 text-sm text-[#eef1ff]">
              Role isolation is active:
              <br />
              `talent` sees candidate tools
              <br />
              `job-owner` sees hiring workspaces
              <br />
              `admin` sees platform controls only
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="status-note error">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="metric-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className="metric-number text-[2rem]">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1efff] text-[#5148c8]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-6">
          <section className="panel scroll-mt-28 p-6" id="system-status">
            <p className="kicker">System Status</p>
            <h3 className="section-title mt-3">Platform readiness without hiring data exposure</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-5">
                <p className="text-sm font-semibold text-[#5148c8]">Persistence layer</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {platform.repository === "mongo"
                    ? "Mongo persistence is active. Sessions and stored records can survive reloads across application restarts."
                    : "Memory mode is active. Data resets when the server restarts."}
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-5">
                <p className="text-sm font-semibold text-[#5148c8]">Platform volume</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {summary.totalJobs} jobs, {summary.totalApplicants} applicants,
                  and {summary.screenedApplicants} shortlist result
                  {summary.screenedApplicants === 1 ? "" : "s"} are currently
                  visible at the platform level without exposing candidate identities.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-5">
                <p className="text-sm font-semibold text-[#5148c8]">Average shortlist quality</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Current average match score is {formatScore(summary.averageMatchScore)},
                  which helps admin judge whether the platform is producing usable shortlist signal.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-5">
                <p className="text-sm font-semibold text-[#5148c8]">Current admin view</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Hiring briefs, applicants, and shortlists stay abstracted here so admin can monitor trust, load, and readiness without overlapping with job-owner workflows.
                </p>
              </div>
            </div>
          </section>

          <section className="panel scroll-mt-28 p-6" id="ai-readiness">
            <p className="kicker">AI Readiness</p>
            <h3 className="section-title mt-3">Screening configuration and trust checks</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-5">
                <p className="text-sm font-semibold text-[#5148c8]">Provider</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {startCase(platform.screeningProvider)} is the current screening provider.
                  {platform.aiEnabled
                    ? " Gemini credentials are configured, although quota or billing limits can still block individual runs."
                    : " Live screening is unavailable until the required provider settings are supplied."}
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-5">
                <p className="text-sm font-semibold text-[#5148c8]">Resume and profile intake</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {platform.ingestionChannels.length > 0
                    ? `Enabled channels: ${platform.ingestionChannels.join(", ")}.`
                    : "No ingestion channels are reported yet. Configure profile and resume intake to strengthen screening reliability."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="panel scroll-mt-28 p-6" id="signals">
            <p className="kicker">Operational Signals</p>
            <h3 className="section-title mt-3">What the admin should monitor now</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-4">
                <p className="text-sm font-semibold text-[#5148c8]">Recent role activity</p>
                {activeRoles.length > 0 ? (
                  <div className="mt-3 grid gap-3">
                    {activeRoles.map((snapshot) => (
                      <div
                        key={snapshot.job.id}
                        className="rounded-[18px] border border-white bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-[#10213c]">
                          {snapshot.job.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {snapshot.applicantCount} applicants, {snapshot.shortlistCount} shortlisted,
                          top score {formatScore(snapshot.topMatchScore ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    No jobs are active yet, so platform activity is still quiet.
                  </p>
                )}
              </div>
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-4">
                <p className="text-sm font-semibold text-[#5148c8]">AI routing</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Job owners run screening, while admin validates readiness and provider state.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#dddfff] bg-[#f6f7ff] p-4">
                <p className="text-sm font-semibold text-[#5148c8]">Current load state</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {dashboardStatus === "loading"
                    ? "Refreshing platform signals now."
                    : "Platform signals are loaded and ready for admin review."}
                </p>
              </div>
            </div>
          </section>

          <section className="panel scroll-mt-28 p-6" id="system-readiness">
            <p className="kicker">Admin Checklist</p>
            <h3 className="section-title mt-3">Professional platform guardrails</h3>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <li>Keep admin limited to platform status and controls.</li>
              <li>Keep job-owner access limited to jobs, applicants, and shortlists.</li>
              <li>Keep talent limited to jobs, profile, applications, and suggestions.</li>
              <li>Validate AI provider and ingestion channels before production rollout.</li>
            </ul>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Last refreshed from the live dashboard endpoint
            </p>
          </section>
        </div>
      </div>
    </section>
  );
};

export const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dashboard, dashboardStatus, error } = useAppSelector(
    (state) => state.recruiter
  );

  useEffect(() => {
    if (dashboardStatus === "idle") {
      void dispatch(loadDashboard());
    }
  }, [dashboardStatus, dispatch]);

  if (!currentUser) {
    return null;
  }

  const jobs = dashboard?.jobs ?? [];

  if (currentUser.roleId === "talent") {
    return <TalentDashboardPage currentUser={currentUser} jobs={jobs} />;
  }

  if (currentUser.roleId === "admin") {
    return (
      <AdminDashboard
        currentUser={currentUser}
        summary={dashboard?.summary ?? emptySummary}
        jobs={jobs}
        platform={dashboard?.platform ?? defaultPlatform}
        dashboardStatus={dashboardStatus}
        error={error}
      />
    );
  }

  return (
    <JobOwnerDashboard
      currentUser={currentUser}
      summary={dashboard?.summary ?? emptySummary}
      jobs={jobs}
      platform={dashboard?.platform ?? defaultPlatform}
      dashboardStatus={dashboardStatus}
      error={error}
    />
  );
};
