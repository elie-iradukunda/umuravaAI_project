"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FilePenLine,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";

type GuideStep = {
  title: string;
  body: string;
  actionLabel: string;
  href: string;
  icon: LucideIcon;
};

const guideSteps: GuideStep[] = [
  {
    title: "Complete your talent profile",
    body: "Save your headline, summary, skills, experience, education, links, and CV text so recruiters and AI screening have enough evidence to assess your fit clearly.",
    actionLabel: "Open profile",
    href: "/talent/profile",
    icon: UserRound,
  },
  {
    title: "Browse jobs carefully",
    body: "Open job details, compare required skills, review the ideal candidate description, and confirm the role matches your experience before you apply.",
    actionLabel: "Browse jobs",
    href: "/talent/jobs",
    icon: Search,
  },
  {
    title: "Submit one structured application",
    body: "Use the guided apply flow to send your saved profile into the selected job. The platform prevents duplicate applications to the same role.",
    actionLabel: "Go to applications",
    href: "/talent/applications",
    icon: FilePenLine,
  },
  {
    title: "Track updates after submit",
    body: "Watch notifications, application status, and screening updates. When a job owner runs AI screening or shortlists you, the latest status appears back in your workspace.",
    actionLabel: "Open notifications",
    href: "/workspace#notifications",
    icon: BellRing,
  },
];

const readinessChecklist = [
  "Use your real full name, email, phone number, and location.",
  "Write a profile summary that explains your strongest experience and focus.",
  "List specific skills with realistic levels and years of experience.",
  "Add recent work history, projects, certifications, and education details.",
  "Keep CV text uploaded and up to date before applying to multiple roles.",
];

const screeningTips = [
  "Match your saved skills to the job requirements instead of leaving generic skill lists.",
  "Describe measurable work in experience and project entries so fit reasoning is stronger.",
  "Keep summary, CV text, and structured profile aligned so the application tells one clear story.",
];

const afterSubmitSteps = [
  "Your application is attached to the chosen job in the job-owner workspace.",
  "The recruiter can review your structured profile and CV evidence.",
  "If AI screening is run, your application receives ranking and fit signals.",
  "Shortlist and status changes return to your dashboard and applications page.",
];

export const TalentApplicationGuidePage = () => {
  const currentUser = useAppSelector(selectCurrentUser);

  if (currentUser?.roleId !== "talent") {
    return (
      <div className="panel p-8">
        <p className="kicker">Talent Access</p>
        <h2 className="section-title mt-3">
          This page is reserved for the talent account
        </h2>
        <p className="section-copy">
          Sign in with a talent account if you want to review the full
          application flow and candidate guidance.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_360px]">
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0b2a67] via-[#1d54ad] to-[#6ba8ff] p-6 text-white shadow-[0_30px_80px_rgba(13,46,111,0.28)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#dce8ff]">
            Talent Application Guide
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Follow the full candidate flow from profile setup to screening updates.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e6f0ff] sm:text-base">
            This page explains how to prepare your profile, choose stronger-fit
            jobs, apply correctly, and understand what happens after your
            application enters the recruiter workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/talent/profile" className="button-primary bg-white text-[#0b2a67] hover:bg-[#ebf2ff]">
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

        <div className="grid gap-4 md:grid-cols-2">
          {guideSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-[28px] border border-[#dbe7ff] bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-lg font-semibold text-[#10213c]">
                  {step.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.body}
                </p>
                <Link href={step.href} className="mt-5 inline-flex items-center text-sm font-semibold text-[#2559b8] transition hover:text-[#173d82]">
                  {step.actionLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="panel p-6">
          <p className="kicker">Before You Apply</p>
          <h3 className="section-title mt-3">
            Candidate readiness checklist
          </h3>
          <div className="mt-5 grid gap-3">
            {readinessChecklist.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0f6991]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">After You Submit</p>
          <h3 className="section-title mt-3">
            What happens in the recruiter and AI workflow
          </h3>
          <div className="mt-5 grid gap-3">
            {afterSubmitSteps.map((item, index) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-sm font-semibold text-[#0f6991]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="panel p-6">
          <p className="kicker">Quick Actions</p>
          <div className="mt-5 grid gap-3">
            <Link href="/talent/profile" className="button-primary">
              Update Profile
            </Link>
            <Link href="/talent/jobs" className="button-secondary">
              Browse Open Jobs
            </Link>
            <Link href="/talent/applications" className="button-secondary">
              Track Applications
            </Link>
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">Stronger Applications</p>
          <div className="mt-5 grid gap-3">
            {screeningTips.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0f6991]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">Workspace Flow</p>
          <div className="mt-5 grid gap-3">
            {[
              {
                label: "Profile",
                icon: UserRound,
              },
              {
                label: "Jobs",
                icon: BriefcaseBusiness,
              },
              {
                label: "Application",
                icon: ClipboardCheck,
              },
              {
                label: "Notifications",
                icon: BellRing,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-[#10213c]">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </section>
  );
};
