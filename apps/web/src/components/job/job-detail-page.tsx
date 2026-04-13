"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FileSearch,
  LoaderCircle,
  Rocket,
  Upload,
  UserPlus,
} from "lucide-react";

import {
  availabilityStatusOptions,
  availabilityTypeOptions,
} from "../../lib/constants";
import {
  buildApplicantPayload,
  buildJobFormValues,
  type ApplicantFormValues,
} from "../../lib/form-mappers";
import { canEditJobSettings, canManageApplicants, canRunScreening } from "../../lib/role-permissions";
import { formatDate, formatScore, startCase } from "../../lib/format";
import { selectCurrentRoleId } from "../../store/auth-slice";
import {
  addApplicants,
  clearUploadWarnings,
  loadJobDetail,
  runScreening,
  uploadApplicants,
} from "../../store/recruiter-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { JobForm } from "./job-form";

type JobDetailPageProps = {
  jobId: string;
};

const applicantDefaults: ApplicantFormValues = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  profileSummary: "",
  totalExperienceYears: 0,
  resumeUrl: "",
  availabilityStatus: "open-to-opportunities",
  availabilityType: "full-time",
  availabilityStartDate: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  skillsText: "",
  languagesText: "",
  experienceText: "",
  educationText: "",
  certificationsText: "",
  projectsText: "",
  tagsText: "",
};

export const JobDetailPage = ({ jobId }: JobDetailPageProps) => {
  const dispatch = useAppDispatch();
  const currentRoleId = useAppSelector(selectCurrentRoleId);
  const {
    jobDetail,
    jobDetailStatus,
    addApplicantStatus,
    uploadApplicantStatus,
    screeningStatus,
    uploadWarnings,
    error,
  } = useAppSelector((state) => state.recruiter);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const applicantForm = useForm<ApplicantFormValues>({
    defaultValues: applicantDefaults,
  });

  useEffect(() => {
    void dispatch(loadJobDetail(jobId));
  }, [dispatch, jobId]);

  const job = jobDetail?.job;
  const applicants = jobDetail?.applicants ?? [];
  const screenings = jobDetail?.screenings ?? [];

  const shortlist = screenings
    .map((screening) => ({
      screening,
      applicant: applicants.find((candidate) => candidate.id === screening.applicantId),
    }))
    .filter((item) => item.applicant);

  const submitApplicant = applicantForm.handleSubmit(async (values) => {
    await dispatch(
      addApplicants({
        jobId,
        applicants: [buildApplicantPayload(values)],
      })
    ).unwrap();

    applicantForm.reset(applicantDefaults);
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    await dispatch(uploadApplicants({ jobId, files: selectedFiles })).unwrap();
    setSelectedFiles([]);
    setFileInputKey((value) => value + 1);
  };

  const handleRunScreening = async () => {
    await dispatch(runScreening(jobId)).unwrap();
  };

  const canEdit = currentRoleId ? canEditJobSettings(currentRoleId) : false;
  const canAddApplicants = currentRoleId ? canManageApplicants(currentRoleId) : false;
  const canTriggerScreening = currentRoleId ? canRunScreening(currentRoleId) : false;

  if (jobDetailStatus === "loading" && !jobDetail) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading job workspace...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="panel p-8">
        <p className="text-lg font-semibold text-ink">Job not found.</p>
        <p className="mt-2 text-sm text-slate-600">
          The requested job workspace could not be loaded.
        </p>
        <Link href="/workspace" className="button-primary mt-5">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="kicker">{job.department}</p>
            <h2 className="section-title mt-3 text-3xl">{job.title}</h2>
            <p className="section-copy max-w-3xl">{job.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{job.location}</span>
            <span className="chip">{startCase(job.employmentType)}</span>
            <span className="chip">{job.minimumExperienceYears}+ years</span>
            <span className="chip">{job.shortlistLimit} shortlist slots</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Applicants
            </p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {applicants.length}
            </p>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Shortlisted
            </p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {screenings.length}
            </p>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Updated
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {formatDate(job.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {error ? <div className="status-note error">{error}</div> : null}
      {uploadWarnings.length > 0 ? (
        <div className="status-note warning flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Upload warnings</p>
            <p className="mt-2">{uploadWarnings.join(" ")}</p>
          </div>
          <button
            className="button-ghost"
            type="button"
            onClick={() => dispatch(clearUploadWarnings())}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-6">
          {canEdit ? (
            <div className="panel p-6">
              <p className="kicker">Edit Job</p>
              <h3 className="section-title mt-3">
                Refine requirements before screening the pool
              </h3>
              <p className="section-copy">
                Update the job brief, skill weighting, or shortlist limit whenever
                the recruiter priorities change.
              </p>
              <div className="mt-6">
                <JobForm
                  mode="edit"
                  jobId={jobId}
                  initialValues={buildJobFormValues(job)}
                />
              </div>
            </div>
          ) : (
            <div className="panel p-6">
              <p className="kicker">Read-Only Workspace</p>
              <h3 className="section-title mt-3">
                This role can review the workspace but cannot edit the hiring brief
              </h3>
              <p className="section-copy">
                Hiring managers and operations users stay focused on review,
                shortlist quality, and pipeline health rather than changing the
                job definition directly.
              </p>
            </div>
          )}

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker">Applicants</p>
                <h3 className="section-title mt-3">
                  Current candidate pool
                </h3>
              </div>
              <span className="chip">{applicants.length} records</span>
            </div>

            <div className="table-shell mt-5">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Profile Depth</th>
                    <th>Skills & Languages</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {applicants.map((applicant) => (
                    <tr key={applicant.id}>
                      <td>
                        <p className="font-semibold text-ink">{applicant.fullName}</p>
                        {applicant.headline ? (
                          <p className="mt-1 text-sm text-slate-600">{applicant.headline}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {applicant.location}{" "}
                          {applicant.email ? `| ${applicant.email}` : ""}
                        </p>
                        {applicant.resumeFileName ? (
                          <p className="mt-1 text-xs text-slate-500">
                            CV: {applicant.resumeFileName}
                          </p>
                        ) : null}
                        <p className="mt-2 max-w-md text-sm text-slate-600">
                          {applicant.profileSummary}
                        </p>
                        {Object.keys(applicant.socialLinks).length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(applicant.socialLinks).map(([label, link]) => (
                              <a
                                key={`${applicant.id}-${label}`}
                                className="chip"
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div className="grid gap-2 text-sm text-slate-600">
                          <p>
                            {applicant.totalExperienceYears} years total experience
                          </p>
                          <p>
                            Availability:{" "}
                            <span className="font-medium text-ink">
                              {startCase(applicant.availability.status)}
                            </span>
                          </p>
                          <p>
                            Preferred type:{" "}
                            <span className="font-medium text-ink">
                              {startCase(applicant.availability.type)}
                            </span>
                          </p>
                          <p>
                            {applicant.experience.length} experience entries,{" "}
                            {applicant.education.length} education records,{" "}
                            {applicant.projects.length} projects
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex max-w-sm flex-wrap gap-2">
                          {applicant.skills.slice(0, 4).map((skill) => (
                            <span key={`${applicant.id}-${skill.name}`} className="chip">
                              {skill.name}
                            </span>
                          ))}
                          {applicant.languages.slice(0, 2).map((language) => (
                            <span
                              key={`${applicant.id}-${language.name}`}
                              className="chip"
                            >
                              {language.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="grid gap-2">
                          <span className="chip">
                            {startCase(applicant.screeningStatus)}
                          </span>
                          {applicant.certifications.length > 0 ? (
                            <span className="chip">
                              {applicant.certifications.length} certifications
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {applicants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-500">
                        No applicants yet. Add structured profiles or upload
                        files from the right-hand panel.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker">Shortlist Results</p>
                <h3 className="section-title mt-3">
                  Ranked recommendations with explainability
                </h3>
              </div>
              <button
                className="button-primary"
                type="button"
                onClick={handleRunScreening}
                disabled={
                  !canTriggerScreening ||
                  screeningStatus === "loading" ||
                  applicants.length === 0
                }
              >
                {screeningStatus === "loading" ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Run Screening
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {shortlist.map(({ screening, applicant }) =>
                applicant ? (
                  <article
                    key={screening.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="chip">Rank #{screening.rank}</span>
                          <span className="chip">{formatScore(screening.matchScore)}</span>
                        </div>
                        <h4 className="mt-3 text-xl font-semibold text-ink">
                          {applicant.fullName}
                        </h4>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">
                          {screening.reasoning.summary}
                        </p>
                      </div>
                      <div className="grid gap-3 rounded-[22px] border border-white bg-white p-4 sm:grid-cols-2 lg:grid-cols-1">
                        <p className="text-sm text-slate-600">
                          Skills:{" "}
                          <span className="font-semibold text-ink">
                            {formatScore(screening.breakdown.skills)}
                          </span>
                        </p>
                        <p className="text-sm text-slate-600">
                          Experience:{" "}
                          <span className="font-semibold text-ink">
                            {formatScore(screening.breakdown.experience)}
                          </span>
                        </p>
                        <p className="text-sm text-slate-600">
                          Education:{" "}
                          <span className="font-semibold text-ink">
                            {formatScore(screening.breakdown.education)}
                          </span>
                        </p>
                        <p className="text-sm text-slate-600">
                          Relevance:{" "}
                          <span className="font-semibold text-ink">
                            {formatScore(screening.breakdown.relevance)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800">
                          Strengths
                        </p>
                        <div className="mt-3 grid gap-2 text-sm text-emerald-900">
                          {screening.reasoning.strengths.map((item) => (
                            <p key={`${screening.id}-${item}`}>{item}</p>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[20px] border border-amber-100 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800">Gaps</p>
                        <div className="mt-3 grid gap-2 text-sm text-amber-900">
                          {screening.reasoning.gaps.map((item) => (
                            <p key={`${screening.id}-${item}`}>{item}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4 text-sm text-slate-700">
                      <span className="font-semibold text-ink">Recommendation:</span>{" "}
                      {screening.reasoning.recommendation}
                    </div>
                  </article>
                ) : null
              )}

              {screenings.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-lg font-medium text-ink">
                    No shortlist has been generated yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Add applicants first, then run the screening engine to see
                    ranked recommendations and reasoning.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="grid gap-6 self-start">
          {canAddApplicants ? (
            <>
              <div className="panel p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="kicker">Structured Intake</p>
                    <h3 className="text-lg font-semibold text-ink">
                      Add one applicant
                    </h3>
                  </div>
                </div>

                <form className="mt-5 grid gap-5" onSubmit={submitApplicant}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className="input"
                      placeholder="Candidate full name"
                      {...applicantForm.register("fullName", { required: true })}
                    />
                    <input
                      className="input"
                      placeholder="Professional headline"
                      {...applicantForm.register("headline")}
                    />
                    <input
                      className="input"
                      placeholder="Email"
                      {...applicantForm.register("email")}
                    />
                    <input
                      className="input"
                      placeholder="Phone"
                      {...applicantForm.register("phone")}
                    />
                    <input
                      className="input"
                      placeholder="Location"
                      {...applicantForm.register("location", { required: true })}
                    />
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Years of experience"
                      {...applicantForm.register("totalExperienceYears", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <input
                    className="input"
                    placeholder="Resume or profile URL"
                    {...applicantForm.register("resumeUrl")}
                  />

                  <textarea
                    className="textarea"
                    placeholder="Profile summary"
                    {...applicantForm.register("profileSummary", { required: true })}
                  />

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-ink">Availability</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <select
                        className="select"
                        {...applicantForm.register("availabilityStatus")}
                      >
                        {availabilityStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {startCase(option)}
                          </option>
                        ))}
                      </select>
                      <select
                        className="select"
                        {...applicantForm.register("availabilityType")}
                      >
                        {availabilityTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {startCase(option)}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        placeholder="Start date (YYYY-MM-DD)"
                        {...applicantForm.register("availabilityStartDate")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <input
                      className="input"
                      placeholder="LinkedIn URL"
                      {...applicantForm.register("linkedinUrl")}
                    />
                    <input
                      className="input"
                      placeholder="GitHub URL"
                      {...applicantForm.register("githubUrl")}
                    />
                    <input
                      className="input"
                      placeholder="Portfolio URL"
                      {...applicantForm.register("portfolioUrl")}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="field-label">Skills</label>
                      <textarea
                        className="textarea"
                        placeholder={`One skill per line: Node.js | advanced | 3`}
                        {...applicantForm.register("skillsText")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Languages</label>
                      <textarea
                        className="textarea"
                        placeholder={`One language per line: English | fluent`}
                        {...applicantForm.register("languagesText")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Experience</label>
                      <textarea
                        className="textarea"
                        placeholder={`One role per line: Company | Backend Engineer | 2023-01 | Present | Key responsibilities | Node.js, PostgreSQL | true`}
                        {...applicantForm.register("experienceText")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Education</label>
                      <textarea
                        className="textarea"
                        placeholder={`One record per line: University | Bachelor's | Computer Science | 2020 | 2024`}
                        {...applicantForm.register("educationText")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Certifications</label>
                      <textarea
                        className="textarea"
                        placeholder={`One record per line: AWS Certified Developer | Amazon | 2024-05`}
                        {...applicantForm.register("certificationsText")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Projects</label>
                      <textarea
                        className="textarea"
                        placeholder={`One record per line: AI Recruitment System | Backend Engineer | 2024-01 | 2024-06 | Next.js, Node.js | https://example.com | AI-powered candidate screening platform`}
                        {...applicantForm.register("projectsText")}
                      />
                    </div>
                    <div>
                      <label className="field-label">Tags</label>
                      <textarea
                        className="textarea"
                        placeholder="Comma-separated tags"
                        {...applicantForm.register("tagsText")}
                      />
                    </div>
                  </div>

                  <button
                    className="button-primary"
                    type="submit"
                    disabled={addApplicantStatus === "loading"}
                  >
                    {addApplicantStatus === "loading" ? "Adding..." : "Add Applicant"}
                  </button>
                </form>
              </div>

              <div className="panel p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="kicker">Bulk Intake</p>
                    <h3 className="text-lg font-semibold text-ink">
                      Upload CSV, Excel, or PDF resumes
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <input
                    key={fileInputKey}
                    className="input"
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={(event) =>
                      setSelectedFiles(Array.from(event.target.files ?? []))
                    }
                  />
                  <p className="text-sm text-slate-600">
                    Supported formats: `.csv`, `.xlsx`, `.xls`, `.pdf`
                  </p>
                  <button
                    className="button-primary"
                    type="button"
                    disabled={
                      uploadApplicantStatus === "loading" || selectedFiles.length === 0
                    }
                    onClick={handleUpload}
                  >
                    {uploadApplicantStatus === "loading" ? "Uploading..." : "Upload Files"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="panel p-6">
              <p className="kicker">Review Access</p>
              <h3 className="text-lg font-semibold text-ink">
                Candidate intake controls are reserved for recruiter-side roles
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This role can inspect the workspace, shortlist, and candidate
                signals, but cannot add or upload new applicants directly.
              </p>
            </div>
          )}

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FileSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="kicker">Role Blueprint</p>
                <h3 className="text-lg font-semibold text-ink">
                  Ideal candidate notes
                </h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              {job.idealCandidate}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {job.requiredSkills.map((skill) => (
                <span key={`${job.id}-${skill.name}`} className="chip">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
