import type {
  AvailabilityStatus,
  AvailabilityType,
  EmploymentType,
  LanguageProficiency,
  SkillLevel,
} from "@umurava/shared";

export const employmentTypeOptions: EmploymentType[] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "remote",
];

export const skillLevelOptions: SkillLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const languageProficiencyOptions: LanguageProficiency[] = [
  "basic",
  "conversational",
  "fluent",
  "native",
];

export const availabilityStatusOptions: AvailabilityStatus[] = [
  "available",
  "open-to-opportunities",
  "not-available",
];

export const availabilityTypeOptions: AvailabilityType[] = [
  "full-time",
  "part-time",
  "contract",
];
