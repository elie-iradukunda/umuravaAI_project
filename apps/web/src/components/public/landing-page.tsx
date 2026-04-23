"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  BrainCircuit,
  FileSpreadsheet,
  Globe2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { formatScore, startCase } from "../../lib/format";
import { api } from "../../lib/api";
import { platformUsers } from "../../lib/platform-users";
import { selectAuthState, selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";

type PublicOpportunity = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  minimumExperienceYears: number;
  summary: string;
  skills: string[];
};

type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const publicFeatures: FeatureCard[] = [
  {
    title: "Structured talent profiles",
    description:
      "Candidates fill clear schema fields for skills, experience, education, certifications, projects, and availability.",
    icon: BadgeCheck,
  },
  {
    title: "AI-ready screening flow",
    description:
      "The platform is prepared for explainable ranking, shortlist generation, and hiring-team-friendly candidate reasoning.",
    icon: BrainCircuit,
  },
  {
    title: "Real-world applicant intake",
    description:
      "Job owners can work with structured profiles, CSV or Excel sheets, resume files, and clear review workflows.",
    icon: FileSpreadsheet,
  },
  {
    title: "Role-based dashboards",
    description:
      "Talent, job owners, and admins each see a workspace designed for their own responsibilities.",
    icon: UsersRound,
  },
];

const faqItems = [
  {
    question: "Can a public visitor see jobs before creating an account?",
    answer:
      "Yes. The landing page shows trending opportunities so candidates can understand what is available before signing up.",
  },
  {
    question: "Who can create an account from the public site?",
    answer:
      "Public users can now create accounts for talent, job owner, or admin roles from the sign-up flow.",
  },
  {
    question: "What happens after account creation?",
    answer:
      "The new user is taken into the workspace that matches the selected role, with the right dashboard and actions for that persona.",
  },
];

const processSteps = [
  "Create an account from the public landing page and choose the role you need.",
  "Enter the workspace that matches your selected role and complete the relevant setup.",
  "If you are talent, complete your profile and apply to open opportunities.",
  "Track application progress while the job owner reviews and runs screening.",
];

export const LandingPage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { hydrated } = useAppSelector(selectAuthState);
  const [opportunities, setOpportunities] = useState<PublicOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.getPublicJobs();
        if (!active) {
          return;
        }

        setOpportunities(
          response.jobs.map((job) => ({
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            employmentType: job.employmentType,
            minimumExperienceYears: job.minimumExperienceYears,
            summary: job.summary,
            skills: job.requiredSkills.map((skill) => skill.name),
          }))
        );
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load live opportunities right now."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);
  const publicMetrics = [
    {
      label: "Open jobs",
      value: String(opportunities.length),
      helper: "Live hiring opportunities visible to visitors",
    },
    {
      label: "Platform roles",
      value: String(platformUsers.length),
      helper: "Talent, job owner, and admin access are available",
    },
    {
      label: "Profile flow",
      value: "Structured",
      helper: "Candidates save one profile and reuse it across applications",
    },
    {
      label: "AI screening",
      value: "Gemini",
      helper: "Shortlist scoring is ready when provider settings are configured",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#10213c]">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-[#eef3fb]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b2a67] to-[#4b8df5] text-sm font-semibold text-white">
              UA
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#5570a7]">
                Umurava AI
              </p>
              <p className="text-base font-semibold text-[#10213c]">
                Talent Platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <a href="#opportunities" className="transition hover:text-[#17448a]">
              Opportunities
            </a>
            <a href="#how-it-works" className="transition hover:text-[#17448a]">
              How It Works
            </a>
            <a href="#roles" className="transition hover:text-[#17448a]">
              User Roles
            </a>
            <a href="#faq" className="transition hover:text-[#17448a]">
              FAQ
            </a>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            {hydrated && currentUser ? (
              <>
                <Link href="/workspace" className="button-primary">
                  Open Workspace
                </Link>
                <Link href="/login" className="button-secondary">
                  Switch Account
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="button-secondary">
                  Sign In
                </Link>
                <Link href="/signup" className="button-primary">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 pb-8 pt-8 sm:px-6 lg:px-8 lg:pb-10 lg:pt-10">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
            <div className="overflow-hidden rounded-[36px] bg-gradient-to-br from-[#0b2a67] via-[#1852ac] to-[#77b8ff] p-8 text-white shadow-[0_38px_90px_rgba(9,34,86,0.28)] sm:p-10">
              <div className="max-w-4xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d8e7ff]">
                  Public Landing Page
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Discover jobs, create a talent account, and move into a clear hiring journey.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-[#e8f0ff]">
                  Public visitors can explore trending opportunities, understand how the
                  platform works, and create an account before entering the role-based
                  workspace. Candidates complete one strong profile and reuse it across
                  every application.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/signup" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b2a67] transition hover:bg-[#ebf2ff]">
                    Create Talent Account
                  </Link>
                  <a href="#opportunities" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                    View Trending Jobs
                  </a>
                  <Link href="/login" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                    Sign In
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {["Talent profiles", "Job applications", "Shortlists", "Recruiter review"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white/[0.12] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <aside className="panel p-6">
              <p className="kicker">Platform Snapshot</p>
              <h2 className="section-title mt-3">What visitors can do right away</h2>
              <div className="mt-5 grid gap-3">
                {[
                  {
                    title: "Browse opportunities",
                    body: "See trending roles, required skills, experience level, and location before signing up.",
                    icon: BriefcaseBusiness,
                  },
                  {
                    title: "Create an account",
                    body: "Public sign-up creates a talent account and moves the candidate into the workspace.",
                    icon: UsersRound,
                  },
                  {
                    title: "Understand the process",
                    body: "Learn how profiles, screening, and applications work before entering the product.",
                    icon: ShieldCheck,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2559b8] shadow-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#10213c]">
                            {item.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {error ? (
                <div className="status-note warning mt-5">
                  Live opportunities could not be loaded right now.
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
            {publicMetrics.map((metric) => (
              <article key={metric.label} className="metric-card">
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <p className="metric-number">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{metric.helper}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="opportunities" className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="panel p-6 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-[#e8eef9] pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="kicker">Trending Opportunities</p>
                  <h2 className="section-title mt-3 text-2xl sm:text-3xl">
                    Public job cards candidates can review before signing up
                  </h2>
                  <p className="section-copy max-w-3xl">
                    These roles help candidates understand market demand, required
                    skills, and the type of opportunities available in the platform.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  {loading ? (
                    <span>Loading live opportunities...</span>
                  ) : (
                    <span>{opportunities.length} roles visible</span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {opportunities.length > 0 ? (
                  opportunities.map((job) => (
                    <article
                      key={job.id}
                      className="rounded-[28px] border border-[#dbe7ff] bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {job.department}
                          </p>
                          <h3 className="mt-3 text-xl font-semibold text-[#10213c]">
                            {job.title}
                          </h3>
                        </div>
                        <span className="chip">{startCase(job.employmentType)}</span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {job.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="chip">{job.location}</span>
                        <span className="chip">
                          {job.minimumExperienceYears}+ years
                        </span>
                        {job.skills.slice(0, 3).map((skill) => (
                          <span key={`${job.id}-${skill}`} className="chip">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link href="/signup" className="button-primary">
                          Create Account To Apply
                        </Link>
                        <Link href="/login" className="button-secondary">
                          Sign In
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-[#c9d8f5] bg-[#f8fbff] px-6 py-10 text-center lg:col-span-3">
                    <p className="text-lg font-semibold text-[#10213c]">
                      No public jobs are live yet.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Create a job-owner account and post a role to make it visible here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
            <div className="panel p-6 sm:p-8">
              <p className="kicker">How It Works</p>
              <h2 className="section-title mt-3 text-2xl sm:text-3xl">
                A simple path from public visitor to active candidate
              </h2>

              <div className="mt-6 grid gap-4">
                {processSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-[#2559b8] shadow-sm">
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm leading-7 text-slate-600">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="grid gap-6">
              <div className="panel p-6">
                <p className="kicker">Why This Matters</p>
                <div className="mt-5 grid gap-3">
                  {publicFeatures.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.title}
                        className="rounded-[24px] border border-[#dbe7ff] bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#10213c]">
                              {feature.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-[#082f49] via-[#0f6991] to-[#59b8d8] p-6 text-white shadow-[0_28px_70px_rgba(6,54,109,0.22)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                  Candidate Outcome
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  One account, one profile, many applications
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/85">
                  The platform is designed so candidates do not repeat the same
                  information every time they apply. Build a strong profile once,
                  then reuse it across live opportunities.
                </p>
                <Link href="/signup" className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0f6991] transition hover:bg-[#e7f8ff]">
                  Start Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section id="roles" className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="panel p-6 sm:p-8">
              <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-6">
                <p className="kicker">Who Uses The Platform</p>
                <h2 className="section-title text-2xl sm:text-3xl">
                  Public users can understand every role before entering the product
                </h2>
                <p className="section-copy max-w-3xl">
                  The product supports candidates, job owners, and admins with
                  clearly separated dashboards and responsibilities.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {platformUsers.map((role) => (
                  <article
                    key={role.id}
                    className="rounded-[28px] border border-[#dbe7ff] bg-white p-5"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                      {role.id === "talent" ? (
                        <UsersRound className="h-5 w-5" />
                      ) : role.id === "job-owner" ? (
                        <BriefcaseBusiness className="h-5 w-5" />
                      ) : (
                        <Globe2 className="h-5 w-5" />
                      )}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-[#10213c]">
                      {role.label}
                    </h3>
                    <p className="mt-1 text-sm text-[#31538e]">{role.title}</p>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {role.summary}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
            <div className="panel p-6 sm:p-8">
              <p className="kicker">FAQ</p>
              <h2 className="section-title mt-3 text-2xl sm:text-3xl">
                Public questions people usually ask first
              </h2>

              <div className="mt-6 grid gap-4">
                {faqItems.map((item) => (
                  <article
                    key={item.question}
                    className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-5"
                  >
                    <h3 className="text-base font-semibold text-[#10213c]">
                      {item.question}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.answer}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="panel p-6 sm:p-8">
              <p className="kicker">Final Call To Action</p>
              <h2 className="section-title mt-3 text-2xl">
                Ready to enter the platform?
              </h2>
              <p className="section-copy">
                Create a candidate account, complete your profile, and start
                applying to live jobs. If you already have an account, go
                straight to sign in.
              </p>

              <div className="mt-6 grid gap-3">
                <Link href="/signup" className="button-primary w-full">
                  Create Talent Account
                </Link>
                <Link href="/login" className="button-secondary w-full">
                  Sign In
                </Link>
                {hydrated && currentUser ? (
                  <Link href="/workspace" className="button-secondary w-full">
                    Open My Workspace
                  </Link>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};
