"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, MapPin, Sparkles } from "lucide-react";

import { formatDate, startCase } from "../../lib/format";
import {
  estimateTalentProfileCompletion,
  loadTalentProfileDraft,
} from "../../lib/talent-profile";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadDashboard } from "../../store/recruiter-slice";

export const TalentJobsPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dashboard, dashboardStatus, error } = useAppSelector((state) => state.recruiter);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    if (dashboardStatus === "idle") {
      void dispatch(loadDashboard());
    }
  }, [dashboardStatus, dispatch]);

  useEffect(() => {
    if (currentUser) {
      setCompletion(estimateTalentProfileCompletion(loadTalentProfileDraft(currentUser)));
    }
  }, [currentUser]);

  const jobs = useMemo(
    () =>
      [...(dashboard?.jobs ?? [])].sort(
        (a, b) =>
          new Date(b.job.updatedAt).getTime() - new Date(a.job.updatedAt).getTime()
      ),
    [dashboard?.jobs]
  );

  if (currentUser?.roleId !== "talent") {
    return (
      <div className="panel p-8">
        <p className="kicker">Talent Access</p>
        <h2 className="section-title mt-3">
          This page is reserved for the talent account
        </h2>
        <p className="section-copy">
          Switch to the demo talent login if you want to browse jobs and apply
          with a structured profile.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <div className="grid gap-6">
        <div className="panel p-6">
          <p className="kicker">Open Opportunities</p>
          <h2 className="section-title mt-3">
            Browse jobs already active in the recruiter workspace
          </h2>
          <p className="section-copy max-w-3xl">
            These roles use the same requirements, skills, and shortlist logic
            the recruiter configured. Apply with your saved structured profile.
          </p>
        </div>

        {error ? <div className="status-note error">{error}</div> : null}

        <div className="grid gap-4">
          {dashboardStatus === "loading" && !dashboard ? (
            <div className="panel p-8 text-center text-sm text-slate-600">
              Loading active jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-lg font-semibold text-[#10213c]">No jobs are available yet.</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Ask the recruiter to create a job first, then return here and apply.
              </p>
            </div>
          ) : (
            jobs.map((snapshot) => (
              <article
                key={snapshot.job.id}
                className="panel p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {snapshot.job.department}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10213c]">
                      {snapshot.job.title}
                    </h3>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                      {snapshot.job.summary}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Shortlist target
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-[#10213c]">
                      {snapshot.job.shortlistLimit}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip">
                    <MapPin className="mr-2 h-3.5 w-3.5" />
                    {snapshot.job.location}
                  </span>
                  <span className="chip">{startCase(snapshot.job.employmentType)}</span>
                  <span className="chip">
                    {snapshot.job.minimumExperienceYears}+ years
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#10213c]">Required skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {snapshot.job.requiredSkills.map((skill) => (
                      <span key={`${snapshot.job.id}-${skill.name}`} className="chip">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#10213c]">Ideal candidate</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {snapshot.job.idealCandidate}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-[#e8eef9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Updated {formatDate(snapshot.job.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/talent/profile" className="button-secondary">
                      Update Profile
                    </Link>
                    <Link
                      href={`/talent/jobs/${snapshot.job.id}/apply`}
                      className="button-primary"
                    >
                      Apply To Job <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="panel p-6">
          <p className="kicker">Application Readiness</p>
          <h3 className="section-title mt-3">Your saved profile status</h3>
          <p className="mt-5 text-5xl font-semibold tracking-tight text-[#0f6991]">
            {completion}%
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Strong profile completeness makes your application much easier for
            recruiters to evaluate quickly and fairly.
          </p>
        </div>

        <div className="panel p-6">
          <p className="kicker">Before You Apply</p>
          <div className="mt-5 grid gap-3">
            {[
              "Make sure your work experience lines include role, dates, and responsibilities.",
              "Add at least one education record and your main languages.",
              "Save the profile before opening the application form.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">After You Apply</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Open your application tracker anytime to see submitted roles and whether
            recruiters have screened them yet.
          </p>
          <Link href="/talent/applications" className="button-secondary mt-5">
            View My Applications
          </Link>
        </div>

        <div className="panel p-6">
          <p className="kicker">Why This Feels Real</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Your application lands directly in the recruiter’s job workspace, so
            you can demonstrate the whole talent-to-shortlist loop inside one
            product.
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Recruiters see your submission under the exact job you applied to.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
};
