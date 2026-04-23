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
    title: "Job Seeker",
    summary:
      "Builds a structured profile, receives matched job suggestions, and applies directly to open roles.",
    dashboardTitle: "Talent opportunity hub",
    dashboardDescription:
      "This workspace helps job seekers keep a strong profile, follow application progress, and move quickly on suggested opportunities.",
    responsibilities: [
      "Complete and maintain a structured profile",
      "Browse jobs and matched opportunities",
      "Apply and track progress from one dashboard",
    ],
    focusAreas: [
      "Profile completeness",
      "Matched opportunities",
      "Application readiness",
    ],
    primaryAction: {
      label: "Complete Profile",
      href: "/talent/profile",
    },
  },
  {
    id: "job-owner",
    label: "Job Owner",
    title: "Hiring Lead",
    summary:
      "Owns job posting, applicant review, AI screening, and shortlist decisions for active roles.",
    dashboardTitle: "Job owner command center",
    dashboardDescription:
      "This workspace stays focused on live roles, applicant quality, AI shortlist output, and the next hiring actions.",
    responsibilities: [
      "Create and update hiring briefs",
      "Review applicants and supporting CV evidence",
      "Run AI screening and manage shortlists",
    ],
    focusAreas: [
      "Open roles",
      "Applicant quality",
      "Shortlist decisions",
    ],
    primaryAction: {
      label: "Create Job",
      href: "/jobs/new",
    },
  },
  {
    id: "admin",
    label: "Admin",
    title: "Platform Administrator",
    summary:
      "Monitors platform readiness, AI configuration, ingestion coverage, and system trust without entering hiring workspaces.",
    dashboardTitle: "Platform control center",
    dashboardDescription:
      "This workspace is reserved for system oversight: platform readiness, AI provider state, ingestion coverage, and operational guidance.",
    responsibilities: [
      "Monitor system and provider readiness",
      "Track ingestion coverage and rollout confidence",
      "Keep platform controls separate from hiring workspaces",
    ],
    focusAreas: [
      "System status",
      "AI readiness",
      "Operational governance",
    ],
    primaryAction: {
      label: "Open System Status",
      href: "/workspace#system-status",
    },
  },
];

export const getPlatformUserDetails = (roleId: PlatformUserId) =>
  platformUsers.find((role) => role.id === roleId) ??
  platformUsers.find((role) => role.id === "job-owner") ??
  platformUsers[0];
