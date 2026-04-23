"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { JobRecord } from "@umurava/shared";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  LoaderCircle,
  MapPin,
  Sparkles,
} from "lucide-react";

import { api } from "../../lib/api";
import { formatDate, startCase } from "../../lib/format";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";

type TalentJobDetailPageProps = {
  jobId: string;
};

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

export const TalentJobDetailPage = ({ jobId }: TalentJobDetailPageProps) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser?.roleId !== "talent") {
      return;
    }

    let active = true;

    const load = async () => {
      setStatus("loading");
      setError("");

      try {
        const response = await api.getPublicJob(jobId);
        if (!active) {
          return;
        }

        setJob(response.job);
        setStatus("succeeded");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load the job details."
        );
        setStatus("failed");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [currentUser, jobId]);

  if (currentUser?.roleId !== "talent") {
    return (
      <div className="panel p-8">
        <p className="kicker">Talent Access</p>
        <h2 className="section-title mt-3">
          This page is reserved for the talent account
        </h2>
        <p className="section-copy">
          Sign in with a talent account if you want to review a job in detail
          before applying.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading job details...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="panel p-8">
        <p className="text-lg font-semibold text-ink">Job not found.</p>
        <p className="mt-2 text-sm text-slate-600">
          {error || "This role could not be loaded right now."}
        </p>
        <Link href="/talent/jobs" className="button-primary mt-5">
          Back to Open Jobs
        </Link>
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
      <div className="grid gap-6">
        {error ? <div className="status-note error">{error}</div> : null}

        <div className="panel p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              <MapPin className="mr-2 h-3.5 w-3.5" />
              {job.location}
            </span>
            <span className="chip">{startCase(job.employmentType)}</span>
            <span className="chip">{job.department}</span>
            <span className="chip">{job.minimumExperienceYears}+ years</span>
          </div>

          <h2 className="section-title mt-5 text-3xl">{job.title}</h2>
          <p className="section-copy mt-4 max-w-4xl">{job.summary}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/talent/jobs" className="button-secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
            <Link href={`/talent/jobs/${job.id}/apply`} className="button-primary">
              Apply To Job <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="kicker">Ideal Candidate</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {job.idealCandidate}
            </p>
          </div>

          <div className="panel p-6">
            <p className="kicker">Education Preferences</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {job.educationPreferences.length > 0
                ? job.educationPreferences.join(", ")
                : "No specific education preference was listed for this role."}
            </p>
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">Required Skills</p>
          <h3 className="section-title mt-3">
            These are the signals the recruiter and AI shortlist look at
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {job.requiredSkills.map((skill) => (
              <div
                key={`${job.id}-${skill.name}`}
                className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="chip">{skill.name}</span>
                  <span className="chip">{startCase(skill.requiredLevel)}</span>
                  {skill.weight != null ? (
                    <span className="chip">{Math.round(skill.weight * 100)}% weight</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {skill.required
                    ? "This is marked as a required signal in the job brief."
                    : "This skill is tracked as optional support evidence."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="panel p-6">
          <p className="kicker">Role Snapshot</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-medium text-[#10213c]">Updated</p>
              <p className="mt-2 text-sm text-slate-600">{formatDate(job.updatedAt)}</p>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-medium text-[#10213c]">Required skills</p>
              <p className="mt-2 text-sm text-slate-600">{job.requiredSkills.length}</p>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-medium text-[#10213c]">Education preferences</p>
              <p className="mt-2 text-sm text-slate-600">
                {job.educationPreferences.length}
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">Application Flow</p>
          <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Once you apply, the job owner can run AI screening against this
              exact hiring brief and shortlist candidates according to the role criteria.
            </p>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Fill your structured profile carefully so the recruiter and AI engine
              have enough evidence to score the application fairly.
            </p>
          </div>

          <Link href={`/talent/jobs/${job.id}/apply`} className="button-primary mt-5">
            Continue To Application
          </Link>
        </div>
      </aside>
    </section>
  );
};
