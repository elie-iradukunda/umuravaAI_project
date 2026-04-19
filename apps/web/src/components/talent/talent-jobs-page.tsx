"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { JobRecord } from "@umurava/shared";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { api } from "../../lib/api";
import { formatDate, startCase } from "../../lib/format";
import {
  estimateTalentProfileCompletion,
  loadTalentProfileDraft,
} from "../../lib/talent-profile";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

export const TalentJobsPage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState("");
  const [completion, setCompletion] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");

  useEffect(() => {
    if (currentUser?.roleId !== "talent") {
      return;
    }

    let active = true;

    const load = async () => {
      setStatus("loading");
      setError("");

      try {
        const response = await api.getPublicJobs();
        if (!active) {
          return;
        }

        setJobs(response.jobs);
        setStatus("succeeded");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load open jobs."
        );
        setStatus("failed");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setCompletion(
        estimateTalentProfileCompletion(loadTalentProfileDraft(currentUser))
      );
    }
  }, [currentUser]);

  const departments = useMemo(
    () => [...new Set(jobs.map((job) => job.department))].sort(),
    [jobs]
  );
  const locations = useMemo(
    () => [...new Set(jobs.map((job) => job.location))].sort(),
    [jobs]
  );
  const employmentTypes = useMemo(
    () => [...new Set(jobs.map((job) => job.employmentType))].sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...jobs]
      .filter((job) => {
        if (departmentFilter !== "all" && job.department !== departmentFilter) {
          return false;
        }

        if (locationFilter !== "all" && job.location !== locationFilter) {
          return false;
        }

        if (
          employmentTypeFilter !== "all" &&
          job.employmentType !== employmentTypeFilter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchCorpus = [
          job.title,
          job.department,
          job.location,
          job.summary,
          job.idealCandidate,
          ...job.requiredSkills.map((skill) => skill.name),
          ...job.educationPreferences,
        ]
          .join(" ")
          .toLowerCase();

        return searchCorpus.includes(normalizedSearch);
      })
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
  }, [
    departmentFilter,
    employmentTypeFilter,
    jobs,
    locationFilter,
    searchValue,
  ]);

  const clearFilters = () => {
    setSearchValue("");
    setDepartmentFilter("all");
    setLocationFilter("all");
    setEmploymentTypeFilter("all");
  };

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
            Browse active jobs and filter to the right fit
          </h2>
          <p className="section-copy max-w-3xl">
            Talent can now browse all live roles, narrow them with filters,
            open a full role detail view, and apply with the same structured
            profile the AI screening flow uses later.
          </p>
        </div>

        <div className="panel p-6">
          <div className="flex flex-col gap-4 border-b border-[#e8eef9] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="kicker">Job Filters</p>
              <h3 className="section-title mt-3">Search by title, skill, location, or role type</h3>
            </div>
            <button className="button-secondary" type="button" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <span className="field-label">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-11"
                  placeholder="Frontend, support, React..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="field-label">Department</span>
              <select
                className="select"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="field-label">Location</span>
              <select
                className="select"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              >
                <option value="all">All locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="field-label">Work Type</span>
              <select
                className="select"
                value={employmentTypeFilter}
                onChange={(event) => setEmploymentTypeFilter(event.target.value)}
              >
                <option value="all">All types</option>
                {employmentTypes.map((employmentType) => (
                  <option key={employmentType} value={employmentType}>
                    {startCase(employmentType)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip">
              <Filter className="mr-2 h-3.5 w-3.5" />
              {filteredJobs.length} matching role{filteredJobs.length === 1 ? "" : "s"}
            </span>
            <span className="chip">
              {jobs.length} live role{jobs.length === 1 ? "" : "s"} total
            </span>
          </div>
        </div>

        {error ? <div className="status-note error">{error}</div> : null}

        <div className="grid gap-4">
          {status === "loading" ? (
            <div className="panel p-8 text-center text-sm text-slate-600">
              Loading active jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-lg font-semibold text-[#10213c]">
                No jobs are available yet.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Ask the recruiter to create a job first, then return here and apply.
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-lg font-semibold text-[#10213c]">
                No roles match the current filters.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Try clearing the filters or broadening your search terms.
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <article key={job.id} className="panel p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {job.department}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10213c]">
                      {job.title}
                    </h3>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                      {job.summary}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Shortlist criteria
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-[#10213c]">
                      {job.requiredSkills.length}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      required skill signals
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip">
                    <MapPin className="mr-2 h-3.5 w-3.5" />
                    {job.location}
                  </span>
                  <span className="chip">{startCase(job.employmentType)}</span>
                  <span className="chip">{job.minimumExperienceYears}+ years</span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                    <p className="text-sm font-semibold text-[#10213c]">
                      Required skills
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill) => (
                        <span key={`${job.id}-${skill.name}`} className="chip">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#dbe7ff] bg-white p-4">
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

                <div className="mt-5 rounded-[24px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#10213c]">Ideal candidate</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {job.idealCandidate}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-[#e8eef9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Updated {formatDate(job.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/talent/jobs/${job.id}`}
                      className="button-secondary"
                    >
                      View Full Details
                    </Link>
                    <Link
                      href={`/talent/jobs/${job.id}/apply`}
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
            job owners and AI screening to evaluate clearly.
          </p>
        </div>

        <div className="panel p-6">
          <p className="kicker">Before You Apply</p>
          <div className="mt-5 grid gap-3">
            {[
              "Use the filters to find roles that match your location, skill set, and preferred work type.",
              "Open the full job detail page to review the ideal candidate notes and education preferences.",
              "Complete your structured profile before submitting so the AI shortlist can score you fairly.",
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
            Your application lands inside the job-owner workspace for that exact
            job, and the job owner can then run AI screening against the role
            requirements they configured.
          </p>
          <Link href="/talent/applications" className="button-secondary mt-5">
            View My Applications
          </Link>
        </div>

        <div className="panel p-6">
          <p className="kicker">Why This Flow Matters</p>
          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf9ff] text-[#0f6991]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              The same job brief the job owner posts becomes the exact criteria
              the AI shortlist uses later.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-[#dbe7ff] bg-white p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#2559b8]">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Talent sees job-friendly detail screens while job-owner-only applicant
              and shortlist data stays inside the hiring workspace.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
};
