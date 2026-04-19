import type { PlatformUserId } from "./platform-users";

export const isTalentUser = (roleId: PlatformUserId) => roleId === "talent";

export const isJobOwner = (roleId: PlatformUserId) => roleId === "job-owner";

export const isAdminUser = (roleId: PlatformUserId) => roleId === "admin";

export const canManageJobs = (roleId: PlatformUserId) => isJobOwner(roleId);

export const canManageApplicants = (roleId: PlatformUserId) =>
  isJobOwner(roleId);

export const canRunScreening = (roleId: PlatformUserId) => isJobOwner(roleId);

export const canEditJobSettings = (roleId: PlatformUserId) =>
  isJobOwner(roleId);

export const canViewJobWorkspace = (roleId: PlatformUserId) =>
  isJobOwner(roleId);
