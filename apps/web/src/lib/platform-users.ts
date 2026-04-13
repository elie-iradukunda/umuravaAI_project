import type { UserRole } from "@umurava/shared";

export type PlatformUserId = UserRole;

export type PlatformUser = {
  id: PlatformUserId;
  label: string;
  title: string;
  summary: string;
  dashboardTitle: string;
  dashboardDescription: string;
  responsibilities: string[];
  focusAreas: string[];
  primaryAction: {
    label: string;
    href: string;
  };
};

export const platformUsers: PlatformUser[] = [
  {
    id: "talent",
    label: "Talent",
    title: "Candidate / Job Seeker",
    summary:
      "Builds a structured profile, browses open jobs, and applies directly into the recruiter screening pipeline.",
    dashboardTitle: "Talent opportunity hub",
    dashboardDescription:
      "This view is designed for candidates: keep your structured profile ready, compare open opportunities, and apply with a profile that recruiters can screen transparently.",
    responsibilities: [
      "Complete and maintain a structured talent profile",
      "Browse active jobs with skills and experience expectations",
      "Apply to roles with one profile-driven submission",
    ],
    focusAreas: [
      "Profile completeness",
      "Job fit and required skills",
      "Application readiness",
    ],
    primaryAction: {
      label: "Complete Profile",
      href: "/talent/profile",
    },
  },
  {
    id: "recruiter",
    label: "Recruiter",
    title: "Talent Acquisition Specialist",
    summary:
      "Owns job setup, candidate ingestion, AI screening, and the first shortlist pass.",
    dashboardTitle: "Recruiter command center",
    dashboardDescription:
      "This view prioritizes open roles, candidate volume, shortlist creation, and the next hiring actions.",
    responsibilities: [
      "Create and edit hiring briefs",
      "Import structured profiles, CVs, and spreadsheet applicants",
      "Run screening and prepare recruiter-ready shortlists",
    ],
    focusAreas: [
      "Pipeline coverage per role",
      "Shortlist readiness",
      "Candidate quality and explainability",
    ],
    primaryAction: {
      label: "Create Job",
      href: "/jobs/new",
    },
  },
  {
    id: "hiring-manager",
    label: "Hiring Manager",
    title: "Department Hiring Manager",
    summary:
      "Reviews shortlisted talent, validates fit, and decides who should move to interviews.",
    dashboardTitle: "Hiring review desk",
    dashboardDescription:
      "This dashboard brings the manager directly to roles that already have shortlist signal and need approval or feedback.",
    responsibilities: [
      "Review top candidates for active roles",
      "Validate strengths, risks, and missing evidence",
      "Approve candidates for interviews or request more sourcing",
    ],
    focusAreas: [
      "Roles ready for review",
      "Top candidate confidence",
      "Hiring bottlenecks needing manager input",
    ],
    primaryAction: {
      label: "Open Review Queue",
      href: "/workspace#decision-center",
    },
  },
  {
    id: "talent-ops",
    label: "Talent Ops",
    title: "Talent Operations Lead",
    summary:
      "Monitors throughput, sourcing gaps, and whether recruiters have enough signal to move each role forward.",
    dashboardTitle: "Pipeline health board",
    dashboardDescription:
      "This view is designed for operational oversight: coverage, weak funnels, and which roles need sourcing support or process attention.",
    responsibilities: [
      "Monitor applicant flow and shortlist coverage",
      "Spot empty or unhealthy pipelines early",
      "Coordinate recruiting workload across teams",
    ],
    focusAreas: [
      "Roles with low applicant volume",
      "Screening coverage across open jobs",
      "Readiness for hiring review",
    ],
    primaryAction: {
      label: "Review Pipeline",
      href: "/workspace#pipeline",
    },
  },
  {
    id: "platform-admin",
    label: "Platform Admin",
    title: "HR Systems Administrator",
    summary:
      "Owns platform readiness, ingestion coverage, system health, and future AI provider configuration.",
    dashboardTitle: "Platform operations board",
    dashboardDescription:
      "This view focuses on system capability: uploads, scoring provider status, storage readiness, and operational trust signals.",
    responsibilities: [
      "Maintain system configuration and rollout readiness",
      "Track ingestion channels and screening mode",
      "Support governance, auditability, and production stability",
    ],
    focusAreas: [
      "Integration readiness",
      "Storage and provider status",
      "Product rollout confidence",
    ],
    primaryAction: {
      label: "Check System Setup",
      href: "/workspace#system-readiness",
    },
  },
];
