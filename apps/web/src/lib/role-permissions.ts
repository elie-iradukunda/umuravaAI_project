import type { PlatformUserId } from "./platform-users";

export const canManageJobs = (roleId: PlatformUserId) =>
  roleId === "recruiter" || roleId === "platform-admin";

export const canManageApplicants = (roleId: PlatformUserId) =>
  roleId === "recruiter" || roleId === "platform-admin";

export const canRunScreening = (roleId: PlatformUserId) =>
  roleId === "recruiter" || roleId === "platform-admin";

export const canEditJobSettings = (roleId: PlatformUserId) =>
  roleId === "recruiter" || roleId === "platform-admin";

export const isTalentUser = (roleId: PlatformUserId) => roleId === "talent";
