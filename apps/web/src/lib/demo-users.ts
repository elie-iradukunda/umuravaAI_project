import type { AuthUser } from "@umurava/shared";

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

export const authStorageKey = "umurava-demo-session";
export const localUsersStorageKey = "umurava-local-users";

export const demoUsers: DemoUser[] = [
  {
    id: "user_recruiter_nadia",
    name: "Nadia Uwase",
    email: "recruiter@umurava.ai",
    password: "Recruiter123!",
    roleId: "recruiter",
    team: "Talent Acquisition",
    location: "Kigali, Rwanda",
    initials: "NU",
    status: "Actively screening for 4 open roles",
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
    status: "Preparing a structured profile and applying to open roles",
  },
  {
    id: "user_manager_daniel",
    name: "Daniel Mugisha",
    email: "manager@umurava.ai",
    password: "Manager123!",
    roleId: "hiring-manager",
    team: "Product Engineering",
    location: "Kampala, Uganda",
    initials: "DM",
    status: "Reviewing shortlist quality and interview readiness",
  },
  {
    id: "user_ops_keza",
    name: "Keza Iradukunda",
    email: "ops@umurava.ai",
    password: "TalentOps123!",
    roleId: "talent-ops",
    team: "Talent Operations",
    location: "Remote",
    initials: "KI",
    status: "Monitoring funnel health across teams",
  },
  {
    id: "user_admin_sonia",
    name: "Sonia Aline",
    email: "admin@umurava.ai",
    password: "Admin123!",
    roleId: "platform-admin",
    team: "HR Systems",
    location: "Kigali, Rwanda",
    initials: "SA",
    status: "Maintaining rollout readiness and platform controls",
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
  recruiter: "Talent Acquisition",
  "hiring-manager": "Hiring Team",
  "talent-ops": "Talent Operations",
  "platform-admin": "Platform Operations",
};

const roleStatuses: Record<PlatformUserId, string> = {
  talent: "Account ready to complete profile and apply to roles",
  recruiter: "Account ready to create jobs and manage applicants",
  "hiring-manager": "Account ready to review shortlisted candidates",
  "talent-ops": "Account ready to monitor pipeline health",
  "platform-admin": "Account ready to manage platform readiness",
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
    return Array.isArray(parsed) ? (parsed as DemoUser[]) : [];
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
  const cachedUser: DemoUser = {
    id: user.id,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    roleId: user.roleId,
    team: roleTeams[user.roleId],
    location: user.location,
    initials: makeInitials(user.name),
    status: roleStatuses[user.roleId],
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
    team: "Candidate Workspace",
    location: input.location.trim(),
    initials: makeInitials(input.name),
    status: "New talent account ready to complete profile and apply",
  };

  const localUsers = getLocalUsers();
  window.localStorage.setItem(
    localUsersStorageKey,
    JSON.stringify([...localUsers, user])
  );

  return user;
};

export const getPlatformUserDetails = (roleId: PlatformUserId) =>
  platformUsers.find((role) => role.id === roleId) ?? platformUsers[0];

export { platformUsers };
