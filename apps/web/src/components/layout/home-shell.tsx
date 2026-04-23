"use client";

import type { ReactNode } from "react";

import { getPlatformUserDetails } from "../../lib/platform-users";
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
  "job-owner": {
    pageTitle: "Job Owner Dashboard",
    pageDescription:
      "Post jobs, review applicants, run AI screening, and manage shortlists from one hiring workspace.",
    accent: "Hiring Workspace",
  },
  admin: {
    pageTitle: "Admin Dashboard",
    pageDescription:
      "Monitor system readiness, AI configuration, and platform controls without entering hiring workspaces.",
    accent: "Platform Control",
  },
} as const;

export const HomeShell = ({ children }: HomeShellProps) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const fallback = getPlatformUserDetails("job-owner");
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
