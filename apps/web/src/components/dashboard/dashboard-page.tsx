"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { DashboardJobSnapshot, DashboardSummary } from "@umurava/shared";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  ClipboardCheck,
  Database,
  Medal,
  Radar,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  Users,
} from "lucide-react";

import { getPlatformUserDetails, platformUsers } from "../../lib/demo-users";
import { canManageJobs } from "../../lib/role-permissions";
import { formatDate, formatScore, startCase } from "../../lib/format";
import { selectCurrentUser } from "../../store/auth-slice";
import { loadDashboard } from "../../store/recruiter-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { TalentDashboardPage } from "./talent-dashboard-page";

type MetricCard = { label: string; value: string; icon: LucideIcon };

const roleIcons: Record<(typeof platformUsers)[number]["id"], LucideIcon> = {
  talent: Sparkles,
  recruiter: UserRoundSearch,
  "hiring-manager": ClipboardCheck,
  "talent-ops": Radar,
  "platform-admin": Settings2,
};

const emptySummary: DashboardSummary = {
  totalJobs: 0,
  totalApplicants: 0,
  screenedApplicants: 0,
  averageMatchScore: 0,
};

const firstName = (name: string) => name.split(" ")[0] ?? name;

const buildMetrics = (
  roleId: (typeof platformUsers)[number]["id"],
  summary: DashboardSummary,
  jobs: DashboardJobSnapshot[]
): MetricCard[] => {
  const ready = jobs.filter((job) => job.shortlistCount > 0).length;
  const risks = jobs.filter(
    (job) => job.applicantCount === 0 || job.applicantCount < job.job.shortlistLimit
  ).length;

  if (roleId === "recruiter") {
    return [
      { label: "Open Jobs", value: String(summary.totalJobs), icon: BriefcaseBusiness },
      { label: "Applicants", value: String(summary.totalApplicants), icon: Users },
      { label: "Shortlisted", value: String(summary.screenedApplicants), icon: Medal },
      { label: "Avg Match", value: formatScore(summary.averageMatchScore), icon: Sparkles },
    ];
  }

  if (roleId === "hiring-manager") {
    return [
      { label: "Review Ready", value: String(ready), icon: ClipboardCheck },
      { label: "Top Candidates", value: String(summary.screenedApplicants), icon: Medal },
      { label: "Avg Match", value: formatScore(summary.averageMatchScore), icon: Sparkles },
      { label: "Needs Signal", value: String(risks), icon: Radar },
    ];
  }

  if (roleId === "talent-ops") {
    return [
      { label: "Live Pipelines", value: String(summary.totalJobs), icon: BriefcaseBusiness },
      { label: "Risk Roles", value: String(risks), icon: Radar },
      { label: "Applicants In Flow", value: String(summary.totalApplicants), icon: Users },
      { label: "Shortlisted", value: String(summary.screenedApplicants), icon: Medal },
    ];
  }

  return [
    { label: "Configured Jobs", value: String(summary.totalJobs), icon: BriefcaseBusiness },
    { label: "Persistence", value: "Mongo Atlas", icon: Database },
    { label: "AI Provider", value: "Mock", icon: BrainCircuit },
    { label: "Coverage", value: "CSV / Excel / PDF", icon: ShieldCheck },
  ];
};

const jobTone = (
  roleId: (typeof platformUsers)[number]["id"],
  snapshot: DashboardJobSnapshot
) => {
  if (roleId === "platform-admin") {
    return snapshot.applicantCount === 0
      ? ["Awaiting data", "bg-[#fff1f2] text-[#be123c]", "No applicant data has landed yet."]
      : ["Tracked", "bg-[#ecfdf5] text-[#047857]", "Ingestion and persistence are active."];
  }

  if (snapshot.shortlistCount > 0) {
    return [
      roleId === "hiring-manager" ? "Ready for review" : "Screened",
      "bg-[#eaf1ff] text-[#2559b8]",
      "Shortlist output and reasoning are already available.",
    ];
  }

  if (snapshot.applicantCount === 0) {
    return ["Needs intake", "bg-[#fff7ed] text-[#c2410c]", "Add applicants before screening can start."];
  }

  return snapshot.applicantCount < snapshot.job.shortlistLimit
    ? ["Below target", "bg-[#fff7ed] text-[#b45309]", "Applicant volume is still below the shortlist target."]
    : ["Healthy", "bg-[#ecfdf5] text-[#047857]", "Coverage looks healthy for the next screening pass."];
};

export const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dashboard, dashboardStatus, error } = useAppSelector((state) => state.recruiter);

  useEffect(() => {
    if (dashboardStatus === "idle") {
      void dispatch(loadDashboard());
    }
  }, [dashboardStatus, dispatch]);

  const roleId = currentUser?.roleId ?? "recruiter";
  const role = getPlatformUserDetails(roleId);
  const RoleIcon = roleIcons[roleId];
  const summary = dashboard?.summary ?? emptySummary;
  const jobs = dashboard?.jobs ?? [];

  const metrics = useMemo(() => buildMetrics(roleId, summary, jobs), [jobs, roleId, summary]);
  const featuredJob = useMemo(
    () =>
      [...jobs].sort((a, b) => (b.topMatchScore ?? 0) - (a.topMatchScore ?? 0) || b.applicantCount - a.applicantCount)[0] ?? null,
    [jobs]
  );
  const boardJobs = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => new Date(b.job.updatedAt).getTime() - new Date(a.job.updatedAt).getTime())
        .slice(0, 4),
    [jobs]
  );
  const skillCloud = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((snapshot) =>
      snapshot.job.requiredSkills.forEach((skill) =>
        counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1)
      )
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [jobs]);

  if (!currentUser) {
    return null;
  }

  if (currentUser.roleId === "talent") {
    return <TalentDashboardPage currentUser={currentUser} jobs={jobs} />;
  }

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
                  <span key={item} className="rounded-full bg-white/[0.14] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={canManageJobs(currentUser.roleId) ? "/jobs/new" : "/workspace#decision-center"} className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b2a67] transition hover:bg-[#ebf2ff]">
                  {canManageJobs(currentUser.roleId) ? "Create Hiring Brief" : "Open Decision Center"}
                </Link>
                <Link href="/workspace#pipeline" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  View Live Pipeline
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/[0.15] bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d5e5ff]">Command View</p>
                  <p className="mt-3 text-xl font-semibold text-white">{featuredJob?.job.title ?? "No featured role yet"}</p>
                </div>
                <span className="rounded-2xl bg-white/[0.15] p-3 text-white">
                  <RoleIcon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  { label: "Open Jobs", value: String(summary.totalJobs) },
                  { label: "Applicants", value: String(summary.totalApplicants) },
                  { label: "Shortlists", value: String(summary.screenedApplicants) },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d5e5ff]">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[34px] border border-[#d9e6ff] bg-white p-6 shadow-panel" id="decision-center">
          <p className="kicker">Screening Snapshot</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10213c]">
            {featuredJob?.job.title ?? "Decision pulse"}
          </h3>
          <div className="mt-4 flex items-end justify-between gap-4 border-b border-[#e6edf9] pb-5">
            <div>
              <p className="text-sm text-slate-500">Best live signal in the workspace</p>
              <p className="mt-2 text-lg font-semibold text-[#10213c]">{role.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Match score</p>
              <p className="mt-1 text-4xl font-semibold text-[#e04848]">
                {formatScore(featuredJob?.topMatchScore ?? summary.averageMatchScore)}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[24px] border border-[#dce8ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-[#2559b8]">Strengths</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>{summary.totalApplicants} applicants are already flowing through the workspace.</li>
                <li>{jobs.filter((job) => job.shortlistCount > 0).length} roles already have shortlist signal.</li>
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#ffe1d6] bg-[#fff8f5] p-4">
              <p className="text-sm font-semibold text-[#d96633]">Gaps / risks</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>{jobs.filter((job) => job.applicantCount === 0).length} roles still have no applicants attached.</li>
                <li>{jobs.filter((job) => job.applicantCount > 0 && job.shortlistCount === 0).length} roles still need another screening pass.</li>
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#f7e7b6] bg-[#fffdf5] p-4">
              <p className="text-sm font-semibold text-[#a97800]">Recommendation</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Focus the next action on the thinnest pipelines first, then use the
                strongest role to demonstrate explainable ranking and shortlist flow.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="metric-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="metric-number">{metric.value}</p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="panel p-6" id="pipeline">
          <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kicker">Hiring Pipelines</p>
              <h3 className="section-title mt-3">Roles that need attention right now</h3>
              <p className="section-copy max-w-3xl">
                This board stays centered on active roles, current screening signal,
                and the next actions your signed-in role should take.
              </p>
            </div>
            <span className="rounded-full bg-[#f5f9ff] px-4 py-2 text-sm font-medium text-[#31538e]">
              {jobs.length} active role{jobs.length === 1 ? "" : "s"}
            </span>
          </div>

          {error ? <div className="status-note error mt-5">{error}</div> : null}

          <div className="mt-6 grid gap-4">
            {dashboardStatus === "loading" && !dashboard ? (
              <div className="rounded-[28px] border border-[#d9e6ff] bg-[#f8fbff] px-6 py-10 text-center text-sm text-slate-600">
                Loading live hiring workspace data...
              </div>
            ) : boardJobs.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[#c9d8f5] bg-[#f8fbff] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-[#10213c]">No roles are active yet.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Create a hiring brief and ingest applicants to light up the dashboard.
                </p>
              </div>
            ) : (
              boardJobs.map((snapshot) => {
                const [badge, accent, message] = jobTone(roleId, snapshot);
                const ratio = snapshot.job.shortlistLimit > 0
                  ? Math.min(Math.round((snapshot.applicantCount / snapshot.job.shortlistLimit) * 100), 100)
                  : 0;

                return (
                  <article key={snapshot.job.id} className="rounded-[28px] border border-[#d8e5ff] bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>
                            {badge}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {snapshot.job.department}
                          </span>
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-[#10213c]">{snapshot.job.title}</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="chip">{snapshot.job.location}</span>
                          <span className="chip">{startCase(snapshot.job.employmentType)}</span>
                          <span className="chip">target {snapshot.job.shortlistLimit}</span>
                        </div>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{message}</p>
                        <div className="mt-5">
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <span>Coverage progress</span>
                            <span>{ratio}%</span>
                          </div>
                          <div className="mt-2 h-3 rounded-full bg-[#edf3ff]">
                            <div className="h-3 rounded-full bg-gradient-to-r from-[#1f57b3] to-[#69a7ff]" style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="grid min-w-[240px] gap-3 rounded-[24px] border border-[#d9e6ff] bg-[#f8fbff] p-4 sm:grid-cols-3 lg:grid-cols-1">
                        <div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Applicants</p><p className="mt-1 text-2xl font-semibold text-[#10213c]">{snapshot.applicantCount}</p></div>
                        <div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Shortlist</p><p className="mt-1 text-2xl font-semibold text-[#10213c]">{snapshot.shortlistCount}</p></div>
                        <div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Top score</p><p className="mt-1 text-2xl font-semibold text-[#10213c]">{snapshot.topMatchScore == null ? "--" : formatScore(snapshot.topMatchScore)}</p></div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#e8eef9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">Last updated {formatDate(snapshot.job.updatedAt)}</p>
                      <Link href={`/jobs/${snapshot.job.id}`} className="button-secondary">
                        Open Workspace <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="panel p-6" id="signals">
            <p className="kicker">Signal Distribution</p>
            <h3 className="section-title mt-3">Skill demand and live role focus</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {skillCloud.length > 0 ? (
                skillCloud.map(([skill, count]) => (
                  <span key={skill} className="rounded-full border border-[#d7e4fb] bg-[#f5f9ff] px-3 py-2 text-sm font-medium text-[#2b4f90]">
                    {skill}
                    <span className="ml-2 text-xs text-slate-500">{count}</span>
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">Skill demand tags will appear here once jobs are created.</p>
              )}
            </div>
          </div>

          <div className="panel p-6" id="system-readiness">
            <p className="kicker">Platform Readiness</p>
            <h3 className="section-title mt-3">System state for demos and rollout checks</h3>
            <div className="mt-5 grid gap-3">
              {role.responsibilities.map((item) => (
                <div key={item} className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#10213c]">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This remains visible for {role.label.toLowerCase()} decisions and demos.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-6" id="personas">
        <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="kicker">Platform Users</p>
            <h3 className="section-title mt-3">Every user lands in the same product shell</h3>
            <p className="section-copy max-w-3xl">
              Talent users, recruiters, hiring managers, talent ops, and platform
              admins all use the same entry point, but the dashboard lens changes
              with the role.
            </p>
          </div>
          <Link href="/login" className="button-secondary">Switch Account</Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {platformUsers.map((persona) => {
            const Icon = roleIcons[persona.id];
            const isCurrent = persona.id === roleId;

            return (
              <article key={persona.id} className={`rounded-[28px] border p-5 transition ${isCurrent ? "border-[#0b2a67] bg-gradient-to-br from-[#0b2a67] via-[#184a97] to-[#4d8ef6] text-white shadow-[0_24px_60px_rgba(11,42,103,0.25)]" : "border-[#dbe7ff] bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${isCurrent ? "bg-white/[0.14] text-white" : "bg-[#eaf1ff] text-[#2559b8]"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isCurrent ? "text-white/70" : "text-slate-400"}`}>
                    {isCurrent ? "Current" : "User"}
                  </span>
                </div>
                <h4 className="mt-5 text-xl font-semibold">{persona.label}</h4>
                <p className={`mt-1 text-sm ${isCurrent ? "text-white/80" : "text-slate-600"}`}>{persona.title}</p>
                <p className={`mt-4 text-sm leading-6 ${isCurrent ? "text-white/90" : "text-slate-600"}`}>{persona.summary}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
