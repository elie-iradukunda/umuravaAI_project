import { normalizeUserRole, type AuthUser } from "@umurava/shared";

import { platformUsers, type PlatformUserId } from "./platform-users";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  roleId: PlatformUserId;
  team: string;
  location: string;
  initials: string;
  status: string;
};

type StoredUserLike = Omit<DemoUser, "roleId" | "team" | "status" | "initials"> & {
  roleId: string;
  team?: string;
  status?: string;
  initials?: string;
};

export const authStorageKey = "umurava-demo-session";
export const localUsersStorageKey = "umurava-local-users";

export const demoUsers: DemoUser[] = [
  {
    id: "user_job_owner_nadia",
    name: "Nadia Uwase",
    email: "jobowner@umurava.ai",
    password: "JobOwner123!",
    roleId: "job-owner",
    team: "Hiring Leadership",
    location: "Kigali, Rwanda",
    initials: "NU",
    status: "Managing live roles and AI shortlist decisions",
  },
  {
    id: "user_talent_elie",
    name: "Elie Niyonzima",
    email: "talent@umurava.ai",
    password: "Talent123!",
    roleId: "talent",
    team: "Candidate Workspace",
    location: "Kigali, Rwanda",
    initials: "EN",
    status: "Keeping a profile ready and applying to open jobs",
  },
  {
    id: "user_admin_sonia",
    name: "Sonia Aline",
    email: "admin@umurava.ai",
    password: "Admin123!",
    roleId: "admin",
    team: "Platform Operations",
    location: "Kigali, Rwanda",
    initials: "SA",
    status: "Monitoring AI readiness and platform controls",
  },
];

const isBrowser = () => typeof window !== "undefined";

const makeInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const roleTeams: Record<PlatformUserId, string> = {
  talent: "Candidate Workspace",
  "job-owner": "Hiring Leadership",
  admin: "Platform Operations",
};

const roleStatuses: Record<PlatformUserId, string> = {
  talent: "Account ready to complete a profile and apply to roles",
  "job-owner": "Account ready to post jobs and manage applicants",
  admin: "Account ready to monitor platform controls and AI readiness",
};

const normalizeStoredUser = (user: StoredUserLike): DemoUser => {
  const roleId = normalizeUserRole(user.roleId);

  return {
    id: user.id,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    password: user.password,
    roleId,
    team: roleTeams[roleId],
    location: user.location,
    initials: user.initials?.trim() || makeInitials(user.name),
    status: roleStatuses[roleId],
  };
};

export const getLocalUsers = (): DemoUser[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(localUsersStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((user) => normalizeStoredUser(user as StoredUserLike))
      : [];
  } catch {
    return [];
  }
};

export const getAllUsers = (): DemoUser[] => [...demoUsers, ...getLocalUsers()];

export const getUserById = (userId: string | null | undefined) =>
  getAllUsers().find((user) => user.id === userId) ?? null;

export const getUserByEmail = (email: string) =>
  getAllUsers().find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase()
  ) ?? null;

export const cacheAuthenticatedUser = (user: AuthUser): DemoUser => {
  const roleId = normalizeUserRole(user.roleId);
  const cachedUser: DemoUser = {
    id: user.id,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    roleId,
    team: roleTeams[roleId],
    location: user.location,
    initials: makeInitials(user.name),
    status: roleStatuses[roleId],
  };

  if (!isBrowser()) {
    return cachedUser;
  }

  const localUsers = getLocalUsers().filter(
    (existingUser) =>
      existingUser.id !== cachedUser.id &&
      existingUser.email.toLowerCase() !== cachedUser.email.toLowerCase()
  );

  window.localStorage.setItem(
    localUsersStorageKey,
    JSON.stringify([...localUsers, cachedUser])
  );

  return cachedUser;
};

export const createLocalTalentUser = (input: {
  name: string;
  email: string;
  password: string;
  location: string;
}): DemoUser => {
  if (!isBrowser()) {
    throw new Error("Account creation is only available in the browser.");
  }

  const existingUser = getUserByEmail(input.email);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user: DemoUser = {
    id: `user_talent_${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    roleId: "talent",
    team: roleTeams.talent,
    location: input.location.trim(),
    initials: makeInitials(input.name),
    status: "New talent account ready to complete a profile and apply",
  };

  const localUsers = getLocalUsers();
  window.localStorage.setItem(
    localUsersStorageKey,
    JSON.stringify([...localUsers, user])
  );

  return user;
};

export const getPlatformUserDetails = (roleId: PlatformUserId) =>
  platformUsers.find((role) => role.id === roleId) ??
  platformUsers.find((role) => role.id === "job-owner") ??
  platformUsers[0];

export { platformUsers };
