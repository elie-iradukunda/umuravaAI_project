"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, LoaderCircle, Send, Sparkles } from "lucide-react";

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
import { addApplicants, loadJobDetail } from "../../store/recruiter-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { TalentProfileFields } from "./talent-profile-fields";

type TalentApplyPageProps = {
  jobId: string;
};

export const TalentApplyPage = ({ jobId }: TalentApplyPageProps) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const { jobDetail, jobDetailStatus, addApplicantStatus, error } = useAppSelector(
    (state) => state.recruiter
  );
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<TalentProfileValues>({
    defaultValues: buildTalentProfileDefaults(currentUser ?? undefined),
  });

  useEffect(() => {
    void dispatch(loadJobDetail(jobId));
  }, [dispatch, jobId]);

  useEffect(() => {
    form.reset(loadTalentProfileDraft(currentUser ?? undefined));
  }, [currentUser, form]);

  const values = form.watch();
  const completion = useMemo(
    () => estimateTalentProfileCompletion(values),
    [values]
  );

  const job = jobDetail?.job;

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

  const handleSubmit = form.handleSubmit(async (submittedValues) => {
    const profilePayload = {
      ...buildTalentProfilePayload(submittedValues),
      email: currentUser.email,
      fullName: submittedValues.fullName.trim() || currentUser.name,
    };
    saveTalentProfileDraft(submittedValues, currentUser);
    await dispatch(
      addApplicants({
        jobId,
        applicants: [profilePayload],
      })
    ).unwrap();
    setSubmitted(true);
  });

  if (jobDetailStatus === "loading" && !jobDetail) {
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
          This job could not be loaded for application.
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
            Your profile has been sent to the recruiter workspace
          </h2>
          <p className="section-copy max-w-3xl">
            The job application is now attached to <strong>{job.title}</strong>.
            Switch back to the recruiter account and open this job to see your
            profile in the applicant list.
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
          <p className="kicker">Recruiter Check</p>
          <div className="mt-5 grid gap-3">
            {[
              "Sign out and login as recruiter.",
              "Open the same job workspace.",
              "You will see this application in the applicants table and can run screening.",
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

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <div className="grid gap-6">
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
          </div>
        </div>

        <form className="grid gap-6" onSubmit={handleSubmit}>
          <TalentProfileFields form={form} />

          {error ? <div className="status-note error">{error}</div> : null}

          <div className="panel flex flex-wrap items-center gap-3 p-6">
            <button
              className="button-primary"
              type="submit"
              disabled={addApplicantStatus === "loading"}
            >
              {addApplicantStatus === "loading" ? (
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
            Higher completion means the recruiter and screening logic have more
            evidence to score your fit clearly.
          </p>
        </div>

        <div className="panel p-6">
          <p className="kicker">Demo Tip</p>
          <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Use the demo example profile if you want a fast end-to-end demo,
              then switch back to recruiter and show the newly added applicant.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
};
