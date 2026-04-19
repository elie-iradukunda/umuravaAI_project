"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { JobRecord, TalentApplicationRecord } from "@umurava/shared";
import { CheckCircle2, LoaderCircle, Send, Sparkles } from "lucide-react";

import { api } from "../../lib/api";
import { formatDate, startCase } from "../../lib/format";
import {
  buildTalentProfilePayload,
  buildTalentProfileDefaults,
  estimateTalentProfileCompletion,
  loadTalentProfileDraft,
  saveTalentProfileDraft,
  type TalentProfileValues,
} from "../../lib/talent-profile";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";
import { TalentProfileFields } from "./talent-profile-fields";

type TalentApplyPageProps = {
  jobId: string;
};

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";
type SubmitStatus = "idle" | "loading" | "succeeded" | "failed";

export const TalentApplyPage = ({ jobId }: TalentApplyPageProps) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [loadError, setLoadError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] =
    useState<TalentApplicationRecord | null>(null);

  const form = useForm<TalentProfileValues>({
    defaultValues: buildTalentProfileDefaults(currentUser ?? undefined),
  });

  useEffect(() => {
    form.reset(loadTalentProfileDraft(currentUser ?? undefined));
  }, [currentUser, form]);

  useEffect(() => {
    if (currentUser?.roleId !== "talent") {
      return;
    }

    let active = true;

    const load = async () => {
      setLoadStatus("loading");
      setLoadError("");

      try {
        const [jobResponse, applicationsResponse] = await Promise.all([
          api.getPublicJob(jobId),
          api.getTalentApplications(currentUser.email, currentUser.name),
        ]);

        if (!active) {
          return;
        }

        setJob(jobResponse.job);
        setExistingApplication(
          applicationsResponse.applications.find(
            (application) => application.job.id === jobId
          ) ?? null
        );
        setLoadStatus("succeeded");
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadStatus("failed");
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load the application workspace."
        );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [currentUser, jobId]);

  const values = form.watch();
  const completion = useMemo(
    () => estimateTalentProfileCompletion(values),
    [values]
  );

  const handleSubmit = form.handleSubmit(async (submittedValues) => {
    if (!currentUser) {
      return;
    }

    const profilePayload = {
      ...buildTalentProfilePayload(submittedValues),
      email: currentUser.email,
      fullName: submittedValues.fullName.trim() || currentUser.name,
    };

    saveTalentProfileDraft(submittedValues, currentUser);
    setSubmitStatus("loading");
    setSubmitError("");

    try {
      await api.addApplicants(jobId, [profilePayload]);
      setSubmitStatus("succeeded");
      setSubmitted(true);
    } catch (error) {
      setSubmitStatus("failed");
      setSubmitError(
        error instanceof Error ? error.message : "Could not submit the application."
      );
    }
  });

  if (currentUser?.roleId !== "talent") {
    return (
      <div className="panel p-8">
        <p className="kicker">Talent Access</p>
        <h2 className="section-title mt-3">
          This page is reserved for the talent account
        </h2>
        <p className="section-copy">
          Switch to the demo talent login if you want to submit a profile-driven
          application.
        </p>
      </div>
    );
  }

  if (loadStatus === "loading") {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading application workspace...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="panel p-8">
        <p className="text-lg font-semibold text-ink">Job not found.</p>
        <p className="mt-2 text-sm text-slate-600">
          {loadError || "This job could not be loaded for application."}
        </p>
        <Link href="/talent/jobs" className="button-primary mt-5">
          Back to Talent Jobs
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="panel p-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="kicker mt-6">Application Submitted</p>
          <h2 className="section-title mt-3">
            Your profile has been sent to the job-owner workspace
          </h2>
          <p className="section-copy max-w-3xl">
            The job application is now attached to <strong>{job.title}</strong>.
            The job owner can open this role and run AI screening against the
            shortlist criteria they configured.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/talent/jobs" className="button-primary">
              Back to Jobs
            </Link>
            <Link href="/talent/applications" className="button-secondary">
              View My Applications
            </Link>
          </div>
        </div>

        <aside className="panel p-6">
          <p className="kicker">Recruiter Next Step</p>
          <div className="mt-5 grid gap-3">
            {[
              "The job owner sees this application inside the job workspace.",
              "They can compare your structured profile against the role requirements.",
              "They can run AI screening to produce ranked shortlist recommendations.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    );
  }

  if (existingApplication) {
    return (
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="panel p-8">
          <p className="kicker">Already Applied</p>
          <h2 className="section-title mt-3">
            You already submitted an application for {job.title}
          </h2>
          <p className="section-copy max-w-3xl">
            This prevents duplicate applications for the same job. You can open
            your applications page to track the current status or browse other roles.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/talent/applications" className="button-primary">
              View My Applications
            </Link>
            <Link href={`/talent/jobs/${job.id}`} className="button-secondary">
              View Job Details
            </Link>
          </div>
        </div>

        <aside className="panel p-6">
          <p className="kicker">Submission Details</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-medium text-[#10213c]">Submitted</p>
              <p className="mt-2 text-sm text-slate-600">
                {formatDate(existingApplication.submittedAt)}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-medium text-[#10213c]">Current state</p>
              <p className="mt-2 text-sm text-slate-600">
                {startCase(existingApplication.applicant.screeningStatus)}
              </p>
            </div>
          </div>
        </aside>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <div className="grid gap-6">
        {loadError ? <div className="status-note error">{loadError}</div> : null}

        <div className="panel p-6">
          <p className="kicker">Apply To Job</p>
          <h2 className="section-title mt-3">{job.title}</h2>
          <p className="section-copy max-w-3xl">{job.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip">{job.location}</span>
            <span className="chip">{startCase(job.employmentType)}</span>
            <span className="chip">{job.minimumExperienceYears}+ years</span>
            <span className="chip">Updated {formatDate(job.updatedAt)}</span>
          </div>
        </div>

        <div className="panel p-6">
          <p className="kicker">Role Expectations</p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-[#10213c]">Ideal candidate</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {job.idealCandidate}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-white p-4">
              <p className="text-sm font-semibold text-[#10213c]">Required skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span key={`${job.id}-${skill.name}`} className="chip">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] border border-[#dbe7ff] bg-white p-4">
              <p className="text-sm font-semibold text-[#10213c]">
                Education preferences
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {job.educationPreferences.length > 0
                  ? job.educationPreferences.join(", ")
                  : "No specific education preference was listed for this role."}
              </p>
            </div>
          </div>
        </div>

        <form className="grid gap-6" onSubmit={handleSubmit}>
          <TalentProfileFields form={form} />

          {submitError ? <div className="status-note error">{submitError}</div> : null}

          <div className="panel flex flex-wrap items-center gap-3 p-6">
            <button
              className="button-primary"
              type="submit"
              disabled={submitStatus === "loading"}
            >
              {submitStatus === "loading" ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </button>
            <Link href={`/talent/jobs/${job.id}`} className="button-secondary">
              View Job Details
            </Link>
            <Link href="/talent/profile" className="button-secondary">
              Save Profile First
            </Link>
          </div>
        </form>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="panel p-6">
          <p className="kicker">Profile Readiness</p>
          <p className="mt-4 text-5xl font-semibold tracking-tight text-[#0f6991]">
            {completion}%
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Higher completion means the job owner and screening logic have more
            evidence to score your fit clearly.
          </p>
        </div>

        <div className="panel p-6">
          <p className="kicker">What Happens After Submit</p>
          <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              The job owner sees this application under the same job and can run
              AI shortlisting according to the configured skills, experience,
              education, and relevance criteria.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
};
