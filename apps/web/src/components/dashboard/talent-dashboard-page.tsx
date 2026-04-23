"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  DashboardJobSnapshot,
  NotificationRecord,
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
import { formatDate, formatScore, startCase } from "../../lib/format";
import type { SessionUser } from "../../lib/session-user";
import { buildTalentJobSuggestions } from "../../lib/talent-job-match";
import {
  buildTalentProfileDefaults,
  buildTalentProfileValues,
  estimateTalentProfileCompletion,
  type TalentProfileValues,
} from "../../lib/talent-profile";
import {
  markNotificationsRead,
  selectNotifications,
  selectNotificationsState,
  selectNotificationSummary,
} from "../../store/notification-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

type TalentDashboardPageProps = {
  currentUser: SessionUser;
  jobs: DashboardJobSnapshot[];
};

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

const shortlistedDecisionIds = new Set(["shortlist", "strong-shortlist"]);

const notificationToneStyles: Record<NotificationRecord["tone"], string> = {
  info: "border-[#dbe7ff] bg-[#f8fbff] text-[#2559b8]",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-[#f7e7b6] bg-[#fffdf5] text-[#a97800]",
};

export const TalentDashboardPage = ({
  currentUser,
  jobs,
}: TalentDashboardPageProps) => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const notificationSummary = useAppSelector(selectNotificationSummary);
  const {
    error: notificationError,
    markStatus,
    status: notificationsStatus,
  } = useAppSelector(selectNotificationsState);
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
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await api.getTalentProfile(currentUser.id);
        if (!active) {
          return;
        }

        const profile = buildTalentProfileValues(response.profile, currentUser);
        setProfileDraft(profile);
        setProfileCompletion(estimateTalentProfileCompletion(profile));
        setSavedSkillCount(profile.skills.filter((item) => item.name.trim()).length);
        setSavedExperienceCount(
          profile.experience.filter(
            (item) => item.company.trim() || item.role.trim()
          ).length
        );
      } catch {
        if (!active) {
          return;
        }

        const defaults = buildTalentProfileDefaults(currentUser);
        setProfileDraft(defaults);
        setProfileCompletion(estimateTalentProfileCompletion(defaults));
        setSavedSkillCount(0);
        setSavedExperienceCount(0);
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      setApplicationsStatus("loading");
      setApplicationsError("");

      try {
        const response = await api.getTalentApplications(currentUser.id);

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

  const shortlistAlerts = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.screening?.decision &&
          shortlistedDecisionIds.has(application.screening.decision)
      ),
    [applications]
  );

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    void dispatch(markNotificationsRead(unreadIds));
  };

  const handleNotificationOpen = (notification: NotificationRecord) => {
    if (notification.isRead) {
      return;
    }

    void dispatch(markNotificationsRead([notification.id]));
  };

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
              <p className="text-sm text-white/75">Unread alerts</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {notificationSummary.unread}
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
            The dashboard now tracks persisted read and unread alerts from your
            real applications and new job activity.
          </p>

          {applicationsError || notificationError ? (
            <div className="status-note error mt-5">
              {applicationsError || notificationError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] px-4 py-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="chip">Total {notificationSummary.total}</span>
              <span className="chip">Unread {notificationSummary.unread}</span>
              <span className="chip">Read {notificationSummary.read}</span>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#2559b8] transition hover:text-[#173d82] disabled:text-slate-400"
              onClick={handleMarkAllRead}
              disabled={
                notificationSummary.unread === 0 || markStatus === "loading"
              }
            >
              {markStatus === "loading" ? "Updating..." : "Mark all read"}
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {notificationsStatus === "loading" && notifications.length === 0 ? (
              <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4 text-sm text-slate-600">
                Loading your notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-[22px] border p-4 transition ${
                    notification.isRead
                      ? "border-[#e7edf8] bg-white"
                      : "border-[#c9daf8] bg-[#f8fbff] shadow-[0_14px_30px_rgba(37,89,184,0.08)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${notificationToneStyles[notification.tone]}`}
                    >
                      {notification.badge}
                    </div>
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        notification.isRead
                          ? "text-slate-400"
                          : "text-[#2559b8]"
                      }`}
                    >
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
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
                      onClick={() => handleNotificationOpen(notification)}
                      className="text-sm font-semibold text-[#2559b8] transition hover:text-[#173d82]"
                    >
                      {notification.actionLabel}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">
                No alerts yet. Apply to jobs or wait for new openings and status
                changes to start receiving live notifications here.
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
          <p className="kicker">Application Guide</p>
          <h3 className="section-title mt-3">
            Follow the full talent application flow step by step
          </h3>
          <p className="section-copy max-w-3xl">
            Use this quick guide to prepare your profile, review jobs
            carefully, submit stronger applications, and understand what the
            recruiter and AI screening flow does next.
          </p>
          <div className="mt-5 grid gap-3">
            {[
              {
                title: "1. Complete your profile",
                body: "Save your summary, skills, experience, education, links, and CV text before you start applying so recruiters have enough evidence to assess your fit.",
              },
              {
                title: "2. Review the job details",
                body: "Open the role first, compare your background to required skills, and confirm the brief matches your experience before submitting anything.",
              },
              {
                title: "3. Submit one structured application",
                body: "Use the guided apply flow to send the same saved profile into the selected job. The platform blocks duplicate applications for that role.",
              },
              {
                title: "4. Track notifications and status",
                body: "After you apply, return to notifications and My Applications to see recruiter review, screening updates, and shortlist changes.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <p className="text-sm font-semibold text-[#10213c]">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/talent/guide" className="button-primary">
              Open Full Guide
            </Link>
            <Link href="/talent/profile" className="button-secondary">
              Update Profile
            </Link>
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
