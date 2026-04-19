"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { employmentTypeOptions, skillLevelOptions } from "../../lib/constants";
import {
  buildJobFormValues,
  buildJobPayload,
  sampleJobFormValues,
  splitCommaValues,
  type JobFormValues,
} from "../../lib/form-mappers";
import { canManageJobs } from "../../lib/role-permissions";
import { selectCurrentRoleId } from "../../store/auth-slice";
import { createJob, updateJob } from "../../store/recruiter-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

type JobFormProps = {
  mode: "create" | "edit";
  jobId?: string;
  initialValues?: ReturnType<typeof buildJobFormValues>;
};

export const JobForm = ({ mode, jobId, initialValues }: JobFormProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentRoleId = useAppSelector(selectCurrentRoleId);
  const { createJobStatus, updateJobStatus, error } = useAppSelector(
    (state) => state.recruiter
  );

  const form = useForm<JobFormValues>({
    defaultValues: initialValues ?? buildJobFormValues(),
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = form;
  const [quickSkillText, setQuickSkillText] = useState("");

  const summaryValue = watch("summary");
  const idealCandidateValue = watch("idealCandidate");
  const requiredSkills = watch("requiredSkills");

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "requiredSkills",
  });

  const appendQuickSkills = () => {
    const existingSkillNames = new Set(
      (requiredSkills ?? [])
        .map((skill) => skill.name.trim().toLowerCase())
        .filter(Boolean)
    );

    const newSkillNames = splitCommaValues(quickSkillText).filter((name) => {
      const normalizedName = name.toLowerCase();
      if (!normalizedName || existingSkillNames.has(normalizedName)) {
        return false;
      }

      existingSkillNames.add(normalizedName);
      return true;
    });

    if (newSkillNames.length === 0) {
      return;
    }

    newSkillNames.forEach((name) =>
      append({
        name,
        requiredLevel: "intermediate",
      })
    );

    setQuickSkillText("");
  };

  const isSubmitting =
    mode === "create"
      ? createJobStatus === "loading"
      : updateJobStatus === "loading";

  if (currentRoleId && !canManageJobs(currentRoleId)) {
    return (
      <section className="panel p-6">
        <p className="kicker">Restricted Action</p>
        <h3 className="section-title mt-3">This role cannot create or edit jobs.</h3>
        <p className="section-copy">
          Only job owners can manage hiring briefs. Switch to a job-owner
          account if you want to post or edit job requirements.
        </p>
        <Link href="/workspace" className="button-secondary mt-6">
          Back to Dashboard
        </Link>
      </section>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = buildJobPayload(values);

    if (mode === "create") {
      const createdJob = await dispatch(createJob(payload)).unwrap();
      router.push(`/jobs/${createdJob.id}`);
      return;
    }

    if (!jobId) {
      return;
    }

    await dispatch(updateJob({ jobId, input: payload })).unwrap();
  });

  return (
    <section className="panel p-6">
      <form className="grid gap-8" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="field-label">Job title</label>
            <input
              className="input"
              placeholder="Frontend Engineer"
              {...register("title", { required: true })}
            />
          </div>
          <div>
            <label className="field-label">Department</label>
            <input
              className="input"
              placeholder="Product Engineering"
              {...register("department", { required: true })}
            />
          </div>
          <div>
            <label className="field-label">Location</label>
            <input
              className="input"
              placeholder="Kigali, Rwanda"
              {...register("location", { required: true })}
            />
          </div>
          <div>
            <label className="field-label">Employment type</label>
            <select className="select" {...register("employmentType")}>
              {employmentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Minimum experience years</label>
            <input
              className="input"
              type="number"
              min={0}
              step={1}
              {...register("minimumExperienceYears", {
                valueAsNumber: true,
              })}
            />
          </div>
          <div>
            <label className="field-label">Shortlist size</label>
            <input
              className="input"
              type="number"
              min={1}
              max={20}
              step={1}
              {...register("shortlistLimit", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Role summary</label>
          <textarea
            className="textarea"
            placeholder="Describe the role, team, outcomes, and recruiter expectations."
            {...register("summary", {
              required: "Role summary is required.",
              minLength: {
                value: 20,
                message: "Role summary must be at least 20 characters.",
              },
            })}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className={errors.summary ? "text-rose-600" : "text-slate-500"}>
              {errors.summary?.message ??
                "Give the job owner and screening engine enough context. Minimum 20 characters."}
            </span>
            <span
              className={
                (summaryValue?.length ?? 0) < 20 ? "text-amber-600" : "text-emerald-600"
              }
            >
              {summaryValue?.length ?? 0}/20
            </span>
          </div>
        </div>

        <div>
          <label className="field-label">Ideal candidate profile</label>
          <textarea
            className="textarea"
            placeholder="Describe the strongest version of the candidate you want the engine to prioritize."
            {...register("idealCandidate", {
              required: "Ideal candidate profile is required.",
              minLength: {
                value: 20,
                message: "Ideal candidate profile must be at least 20 characters.",
              },
            })}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span
              className={errors.idealCandidate ? "text-rose-600" : "text-slate-500"}
            >
              {errors.idealCandidate?.message ??
                "Describe who should rank highest for this role. Minimum 20 characters."}
            </span>
            <span
              className={
                (idealCandidateValue?.length ?? 0) < 20
                  ? "text-amber-600"
                  : "text-emerald-600"
              }
            >
              {idealCandidateValue?.length ?? 0}/20
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-ink">Required skills</h3>
              <p className="mt-1 text-sm text-slate-600">
                List the must-have skills. The engine will balance them automatically,
                so you do not need to manage numeric weights.
              </p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() =>
                append({
                  name: "",
                  requiredLevel: "intermediate",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <label className="field-label">Quick add skills</label>
            <p className="mt-2 text-sm text-slate-600">
              Type several skills separated by commas and we will add them for you.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className="input"
                placeholder="React, TypeScript, API Integration"
                value={quickSkillText}
                onChange={(event) => setQuickSkillText(event.target.value)}
              />
              <button
                className="button-secondary"
                type="button"
                onClick={appendQuickSkills}
              >
                Add List
              </button>
            </div>
          </div>

          {mode === "create" ? (
            <button
              className="button-secondary mt-4"
              type="button"
              onClick={() => reset(sampleJobFormValues())}
            >
              Load Demo Job Example
            </button>
          ) : null}

          <div className="mt-4 grid gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.8fr_1fr_auto]"
              >
                <input
                  className="input"
                  placeholder="React"
                  {...register(`requiredSkills.${index}.name` as const, {
                    required: true,
                  })}
                />
                <select
                  className="select"
                  {...register(`requiredSkills.${index}.requiredLevel` as const)}
                  >
                    {skillLevelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                <button
                  className="button-ghost justify-self-end"
                  type="button"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Education preferences</label>
          <textarea
            className="textarea"
            placeholder="Computer Science, Software Engineering, Information Systems"
            {...register("educationPreferencesText")}
          />
        </div>

        {error ? <div className="status-note error">{error}</div> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "create"
                ? "Creating job..."
                : "Saving changes..."
              : mode === "create"
                ? "Create Job Workspace"
                : "Save Job Changes"}
          </button>
          <Link href="/workspace" className="button-secondary">
            Back to Dashboard
          </Link>
        </div>
      </form>
    </section>
  );
};
