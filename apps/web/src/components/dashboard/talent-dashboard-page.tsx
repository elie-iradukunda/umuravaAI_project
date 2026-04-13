"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DashboardJobSnapshot } from "@umurava/shared";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Compass,
  FilePenLine,
  Sparkles,
} from "lucide-react";

import type { DemoUser } from "../../lib/demo-users";
import { startCase } from "../../lib/format";
import {
  buildTalentProfileDefaults,
  estimateTalentProfileCompletion,
  loadTalentProfileDraft,
} from "../../lib/talent-profile";

type TalentDashboardPageProps = {
  currentUser: DemoUser;
  jobs: DashboardJobSnapshot[];
};

export const TalentDashboardPage = ({
  currentUser,
  jobs,
}: TalentDashboardPageProps) => {
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [savedSkillCount, setSavedSkillCount] = useState(0);
  const [savedExperienceCount, setSavedExperienceCount] = useState(0);

  useEffect(() => {
    const draft = loadTalentProfileDraft(currentUser);
    setProfileCompletion(estimateTalentProfileCompletion(draft));
    setSavedSkillCount(draft.skills.filter((item) => item.name.trim()).length);
    setSavedExperienceCount(
      draft.experience.filter((item) => item.company.trim() || item.role.trim()).length
    );
  }, [currentUser]);

  const spotlightJobs = useMemo(
    () =>
      [...jobs]
        .sort(
          (a, b) =>
            b.job.requiredSkills.length - a.job.requiredSkills.length ||
            new Date(b.job.updatedAt).getTime() - new Date(a.job.updatedAt).getTime()
        )
        .slice(0, 4),
    [jobs]
  );

  const recommendedDefaults = buildTalentProfileDefaults(currentUser);

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
            Your profile is the structured talent schema recruiters screen
            against. Complete it once, then reuse it across open jobs.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Open roles</p>
              <p className="mt-3 text-3xl font-semibold text-white">{jobs.length}</p>
            </article>
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Saved skills</p>
              <p className="mt-3 text-3xl font-semibold text-white">{savedSkillCount}</p>
            </article>
            <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/75">Profile completion</p>
              <p className="mt-3 text-3xl font-semibold text-white">{profileCompletion}%</p>
            </article>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/talent/profile" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#06366d] transition hover:bg-[#eaf6fb]">
              Complete Profile
            </Link>
            <Link href="/talent/jobs" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              Browse Jobs
            </Link>
            <Link href="/talent/applications" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              My Applications
            </Link>
          </div>
        </div>

        <aside className="panel p-6">
          <p className="kicker">Demo Starter Profile</p>
          <h3 className="section-title mt-3">A ready-made candidate example</h3>
          <p className="section-copy">
            We prefilled a strong example so you can demo the full recruiter to
            talent journey without typing everything from scratch.
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-[#10213c]">
                {recommendedDefaults.headline}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {recommendedDefaults.profileSummary}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-white p-4">
              <p className="text-sm font-semibold text-[#10213c]">Next move</p>
              <p className="mt-2 text-sm text-slate-600">
                Open your profile, review the sample structured sections, save it,
                then apply to one of the jobs below.
              </p>
            </div>
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
            label: "Experience records",
            value: String(savedExperienceCount),
            icon: FilePenLine,
          },
          {
            label: "Open opportunities",
            value: String(jobs.length),
            icon: BriefcaseBusiness,
          },
          {
            label: "Application path",
            value: "Profile -> Apply",
            icon: Compass,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="metric-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
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

      <div className="panel p-6" id="pipeline">
        <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="kicker">Trending Jobs</p>
            <h3 className="section-title mt-3">Jobs worth checking right now</h3>
            <p className="section-copy max-w-3xl">
              These roles are already live in the recruiter workspace. Complete
              your profile, then apply into the same pipeline recruiters review.
            </p>
          </div>
          <Link href="/talent/jobs" className="button-secondary">
            See All Jobs
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {spotlightJobs.length > 0 ? (
            spotlightJobs.map((snapshot) => (
              <article
                key={snapshot.job.id}
                className="rounded-[28px] border border-[#dbe7ff] bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {snapshot.job.department}
                    </p>
                    <h4 className="mt-3 text-xl font-semibold text-[#10213c]">
                      {snapshot.job.title}
                    </h4>
                  </div>
                  <span className="chip">{startCase(snapshot.job.employmentType)}</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {snapshot.job.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip">{snapshot.job.location}</span>
                  <span className="chip">
                    {snapshot.job.minimumExperienceYears}+ years
                  </span>
                  {snapshot.job.requiredSkills.slice(0, 3).map((skill) => (
                    <span key={`${snapshot.job.id}-${skill.name}`} className="chip">
                      {skill.name}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/talent/jobs/${snapshot.job.id}/apply`}
                    className="button-primary"
                  >
                    Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/talent/profile" className="button-secondary">
                    Update Profile
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#c9d8f5] bg-[#f8fbff] px-6 py-10 text-center lg:col-span-2">
              <p className="text-lg font-semibold text-[#10213c]">No jobs are live yet.</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Ask the recruiter to create a job first, then come back here and
                apply with your saved profile.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6" id="guide">
          <p className="kicker">Application Guide</p>
          <h3 className="section-title mt-3">Simple steps to apply well</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Complete and save your profile so your details are ready.",
              "Open a live job and compare the required skills with your background.",
              "Apply using your saved profile.",
              "Come back to My Applications to track the status.",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <p className="text-sm font-semibold text-[#10213c]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6" id="help">
          <p className="kicker">Helpful Notes</p>
          <h3 className="section-title mt-3">Why your profile details matter</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Skills and languages become structured arrays the screening engine can compare cleanly.",
              "Experience, education, certifications, and projects are captured in the same schema recruiters review.",
              "Availability and social links make the application feel realistic and recruiter-friendly.",
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
          </div>
        </div>
      </div>
    </section>
  );
};
