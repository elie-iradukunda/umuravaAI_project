"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TalentApplicationsResponse } from "@umurava/shared";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  FileSearch,
  Medal,
} from "lucide-react";

import { api } from "../../lib/api";
import { formatDate, formatScore, startCase } from "../../lib/format";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";

export const TalentApplicationsPage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [data, setData] = useState<TalentApplicationsResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "succeeded" | "failed">(
    "idle"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.roleId !== "talent") {
      return;
    }

    let active = true;

    const load = async () => {
      setStatus("loading");
      setError("");

      try {
        const response = await api.getTalentApplications(currentUser.id);
        if (!active) {
          return;
        }

        setData(response);
        setStatus("succeeded");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load talent applications."
        );
        setStatus("failed");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [currentUser]);

  if (currentUser?.roleId !== "talent") {
    return (
      <div className="panel p-8">
        <p className="kicker">Talent Access</p>
        <h2 className="section-title mt-3">
          This page is reserved for the talent account
        </h2>
        <p className="section-copy">
          Sign in with a talent account if you want to review submitted job
          applications.
        </p>
      </div>
    );
  }

  const applications = data?.applications ?? [];

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <div className="grid gap-6">
        <div className="panel p-6">
          <p className="kicker">My Applications</p>
          <h2 className="section-title mt-3">
            Track every role you already submitted
          </h2>
          <p className="section-copy max-w-3xl">
            This page shows the actual applications you sent into job-owner
            workspaces, including current status and any screening results.
          </p>
        </div>

        {error ? <div className="status-note error">{error}</div> : null}

        <div className="grid gap-4">
          {status === "loading" && !data ? (
            <div className="panel p-8 text-center text-sm text-slate-600">
              Loading your applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-lg font-semibold text-[#10213c]">
                No applications submitted yet.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Complete your profile, browse jobs, and apply to a role to see it here.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/talent/profile" className="button-secondary">
                  Complete Profile
                </Link>
                <Link href="/talent/jobs" className="button-primary">
                  Browse Jobs
                </Link>
              </div>
            </div>
          ) : (
            applications.map((application) => (
              <article key={application.applicationId} className="panel p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {application.job.department}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10213c]">
                      {application.job.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-500">
                      Submitted {formatDate(application.submittedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="chip">{application.job.location}</span>
                    <span className="chip">
                      {startCase(application.job.employmentType)}
                    </span>
                    <span className="chip">
                      {startCase(application.applicant.screeningStatus)}
                    </span>
                    {application.screening ? (
                      <span className="chip">
                        {formatScore(application.screening.matchScore)}
                      </span>
                    ) : null}
                    {application.screening?.decision ? (
                      <span className="chip">
                        {startCase(application.screening.decision)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
                  <div className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                    <p className="text-sm font-semibold text-[#10213c]">
                      Submitted profile snapshot
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {application.applicant.profileSummary}
                    </p>
                    {application.applicant.resumeFileName ? (
                      <p className="mt-3 text-sm text-slate-500">
                        Attached CV:{" "}
                        <span className="font-medium text-[#10213c]">
                          {application.applicant.resumeFileName}
                        </span>
                      </p>
                    ) : null}
                    {application.applicant.resumeText ? (
                      <details className="mt-4 rounded-[18px] border border-[#e5edf9] bg-white p-4">
                        <summary className="cursor-pointer text-sm font-medium text-[#10213c]">
                          View extracted CV text
                        </summary>
                        <p className="mt-2 text-sm text-slate-500">
                          This is the CV text stored with your application and
                          used during AI screening.
                        </p>
                        <div className="mt-3 max-h-[360px] overflow-y-auto rounded-[16px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-600">
                            {application.applicant.resumeText}
                          </pre>
                        </div>
                      </details>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {application.applicant.skills.slice(0, 5).map((skill) => (
                        <span
                          key={`${application.applicationId}-${skill.name}`}
                          className="chip"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#dbe7ff] bg-white p-4">
                    <p className="text-sm font-semibold text-[#10213c]">Application status</p>
                    <div className="mt-4 grid gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                          <Clock3 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[#10213c]">
                            Current state
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {startCase(application.applicant.screeningStatus)}
                          </p>
                        </div>
                      </div>

                      {application.screening ? (
                        <>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                              <BadgeCheck className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[#10213c]">
                                Match score
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {formatScore(application.screening.matchScore)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff8e7] text-[#b88210]">
                              <Medal className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[#10213c]">
                                Ranking outcome
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Rank #{application.screening.rank}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                              <BadgeCheck className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[#10213c]">
                                Screening signal
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {startCase(application.screening.provider)} provider
                                {application.screening.riskLevel
                                  ? `, ${startCase(application.screening.riskLevel)} risk`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff8e7] text-[#b88210]">
                            <FileSearch className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-[#10213c]">
                              Waiting for job-owner review
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Screening has not been run for this application yet.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {application.screening ? (
                  <div className="mt-5 rounded-[24px] border border-[#dbe7ff] bg-white p-4">
                    <p className="text-sm font-semibold text-[#10213c]">
                      Recruiter-facing reasoning snapshot
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {application.screening.reasoning.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {application.screening.matchedSkills.map((skill) => (
                        <span key={`${application.applicationId}-${skill}`} className="chip">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="panel p-6">
          <p className="kicker">Quick Summary</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
                  <BriefcaseBusiness className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#10213c]">
                    Applications submitted
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#10213c]">
                    {applications.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-medium text-[#10213c]">
                Screened applications
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#10213c]">
                {applications.filter((item) => item.screening).length}
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">Next Move</p>
          <div className="mt-5 grid gap-3">
            <Link href="/talent/jobs" className="button-primary">
              Browse More Jobs
            </Link>
            <Link href="/talent/profile" className="button-secondary">
              Update Profile
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
};
