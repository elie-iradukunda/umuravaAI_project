"use client";

import type { AuthUser } from "@umurava/shared";

import { getPlatformUserDetails } from "./platform-users";

export type SessionUser = AuthUser & {
  initials: string;
  team: string;
  status: string;
};

export const authStorageKey = "umurava-session";

const validRoleIds = ["talent", "job-owner", "admin"] as const;
const legacyRoleMap = {
  recruiter: "job-owner",
  "hiring-manager": "admin",
  "talent-ops": "admin",
  "platform-admin": "admin",
} as const;

const roleTeams: Record<SessionUser["roleId"], string> = {
  talent: "Candidate Workspace",
  "job-owner": "Hiring Leadership",
  admin: "Platform Operations",
};

const roleStatuses: Record<SessionUser["roleId"], string> = {
  talent: "Profile ready for job discovery and applications",
  "job-owner": "Workspace ready for hiring workflows and shortlist review",
  admin: "Workspace ready for platform oversight and system controls",
};

const isBrowser = () => typeof window !== "undefined";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeStoredRole = (value: unknown): SessionUser["roleId"] => {
  if (typeof value === "string" && value in legacyRoleMap) {
    return legacyRoleMap[value as keyof typeof legacyRoleMap];
  }

  return validRoleIds.includes(value as SessionUser["roleId"])
    ? (value as SessionUser["roleId"])
    : "talent";
};

const parseStoredAuthUser = (value: unknown): AuthUser | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.email) ||
    !isNonEmptyString(value.location) ||
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    roleId: normalizeStoredRole(value.roleId),
    location: value.location,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const makeInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const toSessionUser = (user: AuthUser): SessionUser => {
  const role = getPlatformUserDetails(user.roleId);

  return {
    ...user,
    roleId: role.id,
    initials: makeInitials(user.name),
    team: roleTeams[role.id],
    status: roleStatuses[role.id],
  };
};

export const persistSessionUser = (user: AuthUser): SessionUser => {
  const sessionUser = toSessionUser(user);

  if (isBrowser()) {
    window.localStorage.setItem(authStorageKey, JSON.stringify(user));
  }

  return sessionUser;
};

export const readStoredSessionUser = (): SessionUser | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(authStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = parseStoredAuthUser(JSON.parse(raw));
    return parsed ? toSessionUser(parsed) : null;
  } catch {
    return null;
  }
};

export const clearStoredSessionUser = () => {
  if (isBrowser()) {
    window.localStorage.removeItem(authStorageKey);
  }
};
