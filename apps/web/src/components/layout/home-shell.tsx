"use client";

import type { ReactNode } from "react";

import { getPlatformUserDetails } from "../../lib/demo-users";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";
import { ProtectedAppShell } from "./protected-app-shell";

type HomeShellProps = {
  children: ReactNode;
};

const roleCopy = {
  talent: {
    pageTitle: "Talent Dashboard",
    pageDescription:
      "Find jobs, track your applications, update your profile, and follow simple application steps from one candidate workspace.",
    accent: "Candidate Home",
  },
  recruiter: {
    pageTitle: "Recruiter Dashboard",
    pageDescription:
      "Create jobs, review applicants, run screening, and manage shortlists with clear recruiter-facing actions.",
    accent: "Recruiter Home",
  },
  "hiring-manager": {
    pageTitle: "Hiring Manager Dashboard",
    pageDescription:
      "Review shortlisted candidates, compare fit quickly, and focus only on decisions needed from the hiring manager.",
    accent: "Hiring Review",
  },
  "talent-ops": {
    pageTitle: "Talent Operations Dashboard",
    pageDescription:
      "Monitor pipeline health, spot weak funnels, and keep teams moving with clear operational signals.",
    accent: "Operations View",
  },
  "platform-admin": {
    pageTitle: "Platform Admin Dashboard",
    pageDescription:
      "Watch system readiness, ingestion status, and platform controls with simple admin-focused information.",
    accent: "Platform Control",
  },
} as const;

export const HomeShell = ({ children }: HomeShellProps) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const fallback = getPlatformUserDetails("recruiter");
  const roleId = currentUser?.roleId ?? fallback.id;
  const copy = roleCopy[roleId];

  return (
    <ProtectedAppShell
      pageTitle={copy.pageTitle}
      pageDescription={copy.pageDescription}
      accent={copy.accent}
    >
      {children}
    </ProtectedAppShell>
  );
};
