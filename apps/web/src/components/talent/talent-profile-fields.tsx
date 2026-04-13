"use client";

import { useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { FileText, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";

import { api } from "../../lib/api";
import {
  availabilityStatusOptions,
  availabilityTypeOptions,
  languageProficiencyOptions,
  skillLevelOptions,
} from "../../lib/constants";
import { startCase } from "../../lib/format";
import {
  talentProfileFactories,
  type TalentProfileValues,
} from "../../lib/talent-profile";

type TalentProfileFieldsProps = {
  form: UseFormReturn<TalentProfileValues>;
};

type SectionHeaderProps = {
  title: string;
  description: string;
  onAdd: () => void;
  addLabel: string;
};

const SectionHeader = ({
  title,
  description,
  onAdd,
  addLabel,
}: SectionHeaderProps) => (
  <div className="flex flex-col gap-3 border-b border-[#e8eef9] pb-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h4 className="text-lg font-semibold text-[#10213c]">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
    <button className="button-secondary" type="button" onClick={onAdd}>
      <Plus className="mr-2 h-4 w-4" />
      {addLabel}
    </button>
  </div>
);

export const TalentProfileFields = ({ form }: TalentProfileFieldsProps) => {
  const { control, register, setValue, watch } = form;
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploadStatus, setResumeUploadStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");
  const [resumeUploadError, setResumeUploadError] = useState("");

  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });
  const experience = useFieldArray({ control, name: "experience" });
  const education = useFieldArray({ control, name: "education" });
  const certifications = useFieldArray({ control, name: "certifications" });
  const projects = useFieldArray({ control, name: "projects" });
  const uploadedResumeFileName = watch("resumeFileName");
  const uploadedResumeText = watch("resumeText");
  const profileSummary = watch("profileSummary");

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setResumeUploadError("Choose a PDF CV file first.");
      setResumeUploadStatus("failed");
      return;
    }

    setResumeUploadStatus("loading");
    setResumeUploadError("");

    try {
      const result = await api.uploadTalentResume(resumeFile);
      setValue("resumeFileName", result.fileName, { shouldDirty: true });
      setValue("resumeText", result.resumeText, { shouldDirty: true });

      if (!profileSummary.trim()) {
        setValue("profileSummary", result.summaryExcerpt, { shouldDirty: true });
      }

      setResumeUploadStatus("succeeded");
      setResumeFile(null);
    } catch (error) {
      setResumeUploadStatus("failed");
      setResumeUploadError(
        error instanceof Error ? error.message : "Could not upload CV."
      );
    }
  };

  const clearUploadedResume = () => {
    setValue("resumeFileName", "", { shouldDirty: true });
    setValue("resumeText", "", { shouldDirty: true });
    setResumeFile(null);
    setResumeUploadError("");
    setResumeUploadStatus("idle");
  };

  return (
    <div className="grid gap-6">
      <section className="panel p-6">
        <p className="kicker">Basic Information</p>
        <h3 className="section-title mt-3">Core identity and contact details</h3>
        <p className="section-copy">
          This matches the talent profile schema basics recruiters expect before
          screening can begin.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Full name</label>
            <input className="input" {...register("fullName", { required: true })} />
          </div>
          <div>
            <label className="field-label">Professional headline</label>
            <input
              className="input"
              placeholder="Customer Support Specialist"
              {...register("headline")}
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" {...register("email")} />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="input" {...register("phone")} />
          </div>
          <div>
            <label className="field-label">Location</label>
            <input className="input" {...register("location", { required: true })} />
          </div>
          <div>
            <label className="field-label">Total experience years</label>
            <input
              className="input"
              type="number"
              min={0}
              step={1}
              {...register("totalExperienceYears", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="field-label">Resume or profile URL</label>
          <input
            className="input"
            placeholder="https://drive.google.com/... or portfolio resume link"
            {...register("resumeUrl")}
          />
        </div>

        <div className="mt-4 rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-[#10213c]">
                Upload CV
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This is the talent-side resume upload. Add a PDF CV so your
                application includes resume text alongside the structured
                profile fields.
              </p>
            </div>
            <span className="chip">PDF only</span>
          </div>

          <input type="hidden" {...register("resumeFileName")} />
          <input type="hidden" {...register("resumeText")} />

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input
              className="input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] ?? null);
                setResumeUploadError("");
                if (resumeUploadStatus !== "idle") {
                  setResumeUploadStatus("idle");
                }
              }}
            />
            <button
              className="button-primary"
              type="button"
              onClick={handleResumeUpload}
              disabled={resumeUploadStatus === "loading"}
            >
              {resumeUploadStatus === "loading" ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CV
                </>
              )}
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={clearUploadedResume}
            >
              Clear CV
            </button>
          </div>

          {resumeFile ? (
            <p className="mt-3 text-sm text-slate-600">
              Selected file: <span className="font-medium text-[#10213c]">{resumeFile.name}</span>
            </p>
          ) : null}

          {resumeUploadError ? (
            <div className="status-note error mt-4">{resumeUploadError}</div>
          ) : null}

          {uploadedResumeFileName ? (
            <div className="mt-4 rounded-[22px] border border-[#dbe7ff] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#10213c]">
                    Attached CV
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {uploadedResumeFileName}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Extracted text length: {uploadedResumeText.length} characters
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-[#e5edf9] bg-[#f8fbff] p-4">
                <p className="text-sm font-medium text-[#10213c]">
                  Resume preview
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {uploadedResumeText.slice(0, 320)}
                  {uploadedResumeText.length > 320 ? "..." : ""}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <label className="field-label">Profile summary</label>
          <textarea
            className="textarea"
            placeholder="Summarize your strengths, domain experience, and the type of work you do best."
            {...register("profileSummary", { required: true })}
          />
        </div>
      </section>

      <section className="panel p-6">
        <p className="kicker">Availability & Links</p>
        <h3 className="section-title mt-3">Tell recruiters when and how you can work</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label">Availability status</label>
            <select className="select" {...register("availabilityStatus")}>
              {availabilityStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {startCase(option)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Preferred work type</label>
            <select className="select" {...register("availabilityType")}>
              {availabilityTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {startCase(option)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Available from</label>
            <input
              className="input"
              placeholder="YYYY-MM-DD"
              {...register("availabilityStartDate")}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="field-label">LinkedIn URL</label>
            <input className="input" {...register("linkedinUrl")} />
          </div>
          <div>
            <label className="field-label">GitHub URL</label>
            <input className="input" {...register("githubUrl")} />
          </div>
          <div>
            <label className="field-label">Portfolio URL</label>
            <input className="input" {...register("portfolioUrl")} />
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <p className="kicker">Structured Talent Profile</p>
        <h3 className="section-title mt-3">Fill the schema fields using proper rows</h3>
        <p className="section-copy">
          Each section below matches the Umurava talent schema. Add rows instead
          of typing everything into a single text block.
        </p>

        <div className="mt-6 grid gap-6">
          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <SectionHeader
              title="Skills"
              description="Name, proficiency level, and years of experience."
              onAdd={() => skills.append(talentProfileFactories.blankSkill())}
              addLabel="Add Skill"
            />
            <div className="mt-5 grid gap-3">
              {skills.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4 md:grid-cols-[1.6fr_1fr_140px_auto]"
                >
                  <input
                    className="input"
                    placeholder="Customer Support"
                    {...register(`skills.${index}.name` as const)}
                  />
                  <select
                    className="select"
                    {...register(`skills.${index}.level` as const)}
                  >
                    {skillLevelOptions.map((option) => (
                      <option key={option} value={option}>
                        {startCase(option)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Years"
                    {...register(`skills.${index}.yearsOfExperience` as const, {
                      valueAsNumber: true,
                    })}
                  />
                  <button
                    className="button-ghost justify-self-end"
                    type="button"
                    onClick={() => skills.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <SectionHeader
              title="Languages"
              description="Spoken language and proficiency."
              onAdd={() => languages.append(talentProfileFactories.blankLanguage())}
              addLabel="Add Language"
            />
            <div className="mt-5 grid gap-3">
              {languages.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4 md:grid-cols-[1.5fr_1fr_auto]"
                >
                  <input
                    className="input"
                    placeholder="English"
                    {...register(`languages.${index}.name` as const)}
                  />
                  <select
                    className="select"
                    {...register(`languages.${index}.proficiency` as const)}
                  >
                    {languageProficiencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {startCase(option)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button-ghost justify-self-end"
                    type="button"
                    onClick={() => languages.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <SectionHeader
              title="Work Experience"
              description="Capture one role at a time with dates, responsibilities, and technologies."
              onAdd={() => experience.append(talentProfileFactories.blankExperience())}
              addLabel="Add Experience"
            />
            <div className="mt-5 grid gap-3">
              {experience.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 rounded-[22px] border border-[#dbe7ff] bg-white p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_150px_150px_auto]">
                    <input
                      className="input"
                      placeholder="Company Name"
                      {...register(`experience.${index}.company` as const)}
                    />
                    <input
                      className="input"
                      placeholder="Role"
                      {...register(`experience.${index}.role` as const)}
                    />
                    <input
                      className="input"
                      placeholder="Start date"
                      {...register(`experience.${index}.startDate` as const)}
                    />
                    <input
                      className="input"
                      placeholder="End date"
                      {...register(`experience.${index}.endDate` as const)}
                    />
                    <button
                      className="button-ghost justify-self-end"
                      type="button"
                      onClick={() => experience.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                      className="input"
                      placeholder="Technologies or tools used"
                      {...register(`experience.${index}.technologiesText` as const)}
                    />
                    <label className="flex items-center gap-2 rounded-2xl border border-[#dbe7ff] px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        {...register(`experience.${index}.isCurrent` as const)}
                      />
                      Current role
                    </label>
                  </div>
                  <textarea
                    className="textarea"
                    placeholder="Describe responsibilities and achievements"
                    {...register(`experience.${index}.description` as const)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <SectionHeader
              title="Education"
              description="Add academic background using separate columns."
              onAdd={() => education.append(talentProfileFactories.blankEducation())}
              addLabel="Add Education"
            />
            <div className="mt-5 grid gap-3">
              {education.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4 md:grid-cols-[1.4fr_1.1fr_1.2fr_120px_120px_auto]"
                >
                  <input
                    className="input"
                    placeholder="Institution"
                    {...register(`education.${index}.institution` as const)}
                  />
                  <input
                    className="input"
                    placeholder="Degree"
                    {...register(`education.${index}.degree` as const)}
                  />
                  <input
                    className="input"
                    placeholder="Field of study"
                    {...register(`education.${index}.fieldOfStudy` as const)}
                  />
                  <input
                    className="input"
                    placeholder="Start year"
                    {...register(`education.${index}.startYear` as const)}
                  />
                  <input
                    className="input"
                    placeholder="End year"
                    {...register(`education.${index}.endYear` as const)}
                  />
                  <button
                    className="button-ghost justify-self-end"
                    type="button"
                    onClick={() => education.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <SectionHeader
              title="Certifications"
              description="Add certifications with issuer and issue date."
              onAdd={() =>
                certifications.append(talentProfileFactories.blankCertification())
              }
              addLabel="Add Certification"
            />
            <div className="mt-5 grid gap-3">
              {certifications.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4 md:grid-cols-[1.4fr_1.2fr_160px_auto]"
                >
                  <input
                    className="input"
                    placeholder="Certification name"
                    {...register(`certifications.${index}.name` as const)}
                  />
                  <input
                    className="input"
                    placeholder="Issuer"
                    {...register(`certifications.${index}.issuer` as const)}
                  />
                  <input
                    className="input"
                    placeholder="Issue date"
                    {...register(`certifications.${index}.issueDate` as const)}
                  />
                  <button
                    className="button-ghost justify-self-end"
                    type="button"
                    onClick={() => certifications.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <SectionHeader
              title="Projects"
              description="Show relevant portfolio work with role, tools, link, and impact."
              onAdd={() => projects.append(talentProfileFactories.blankProject())}
              addLabel="Add Project"
            />
            <div className="mt-5 grid gap-3">
              {projects.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 rounded-[22px] border border-[#dbe7ff] bg-white p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1.2fr_1.1fr_150px_150px_auto]">
                    <input
                      className="input"
                      placeholder="Project name"
                      {...register(`projects.${index}.name` as const)}
                    />
                    <input
                      className="input"
                      placeholder="Your role"
                      {...register(`projects.${index}.role` as const)}
                    />
                    <input
                      className="input"
                      placeholder="Start date"
                      {...register(`projects.${index}.startDate` as const)}
                    />
                    <input
                      className="input"
                      placeholder="End date"
                      {...register(`projects.${index}.endDate` as const)}
                    />
                    <button
                      className="button-ghost justify-self-end"
                      type="button"
                      onClick={() => projects.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="input"
                      placeholder="Technologies used"
                      {...register(`projects.${index}.technologiesText` as const)}
                    />
                    <input
                      className="input"
                      placeholder="Project link"
                      {...register(`projects.${index}.link` as const)}
                    />
                  </div>
                  <textarea
                    className="textarea"
                    placeholder="Describe what the project achieved"
                    {...register(`projects.${index}.description` as const)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-[#dbe7ff] bg-[#f8fbff] p-5">
            <label className="field-label">Tags</label>
            <input
              className="input"
              placeholder="customer support, communication, crm"
              {...register("tagsText")}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
