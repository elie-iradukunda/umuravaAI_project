import type {
  AvailabilityStatus,
  AvailabilityType,
  CreateApplicantInput,
  LanguageProficiency,
  SkillLevel,
} from "@umurava/shared";

import type { DemoUser } from "./demo-users";

export type TalentSkillFormValue = {
  name: string;
  level: SkillLevel;
};

export type TalentLanguageFormValue = {
  name: string;
  proficiency: LanguageProficiency;
};

export type TalentExperienceFormValue = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologiesText: string;
  isCurrent: boolean;
};

export type TalentEducationFormValue = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
};

export type TalentCertificationFormValue = {
  name: string;
  issuer: string;
  issueDate: string;
};

export type TalentProjectFormValue = {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  technologiesText: string;
  link: string;
  description: string;
};

export type TalentProfileValues = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  profileSummary: string;
  totalExperienceYears: number;
  resumeUrl: string;
  resumeFileName: string;
  resumeText: string;
  availabilityStatus: AvailabilityStatus;
  availabilityType: AvailabilityType;
  availabilityStartDate: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  skills: TalentSkillFormValue[];
  languages: TalentLanguageFormValue[];
  experience: TalentExperienceFormValue[];
  education: TalentEducationFormValue[];
  certifications: TalentCertificationFormValue[];
  projects: TalentProjectFormValue[];
  tagsText: string;
};

export const talentProfileStorageKey = "umurava-talent-profile";

const getTalentProfileStorageKey = (
  user?: Pick<DemoUser, "email">
) => {
  const normalizedEmail = user?.email?.trim().toLowerCase();
  return normalizedEmail
    ? `${talentProfileStorageKey}:${normalizedEmail}`
    : talentProfileStorageKey;
};

const splitCommaValues = (value: string): string[] =>
  value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitLineValues = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitPipeLine = (line: string): string[] =>
  line
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string | number | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: string): boolean =>
  ["true", "yes", "1", "current", "present"].includes(value.trim().toLowerCase());

const defaultSkillYearsByLevel: Record<SkillLevel, number> = {
  beginner: 0.5,
  intermediate: 1.5,
  advanced: 3,
  expert: 5,
};

const estimateSkillYearsOfExperience = (
  totalExperienceYears: number,
  level: SkillLevel
): number =>
  Number(
    Math.min(
      totalExperienceYears > 0
        ? Math.max(totalExperienceYears, 0)
        : defaultSkillYearsByLevel[level],
      defaultSkillYearsByLevel[level]
    ).toFixed(1)
  );

const blankSkill = (): TalentSkillFormValue => ({
  name: "",
  level: "intermediate",
});

const blankLanguage = (): TalentLanguageFormValue => ({
  name: "",
  proficiency: "conversational",
});

const blankExperience = (): TalentExperienceFormValue => ({
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  description: "",
  technologiesText: "",
  isCurrent: false,
});

const blankEducation = (): TalentEducationFormValue => ({
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
});

const blankCertification = (): TalentCertificationFormValue => ({
  name: "",
  issuer: "",
  issueDate: "",
});

const blankProject = (): TalentProjectFormValue => ({
  name: "",
  role: "",
  startDate: "",
  endDate: "",
  technologiesText: "",
  link: "",
  description: "",
});

const migrateLegacyDraft = (value: Record<string, unknown>): Partial<TalentProfileValues> => {
  const skillsText = String(value.skillsText ?? "");
  const languagesText = String(value.languagesText ?? "");
  const experienceText = String(value.experienceText ?? "");
  const educationText = String(value.educationText ?? "");
  const certificationsText = String(value.certificationsText ?? "");
  const projectsText = String(value.projectsText ?? "");

  return {
    fullName: String(value.fullName ?? ""),
    headline: String(value.headline ?? ""),
    email: String(value.email ?? ""),
    phone: String(value.phone ?? ""),
    location: String(value.location ?? ""),
    profileSummary: String(value.profileSummary ?? ""),
    totalExperienceYears: Number(value.totalExperienceYears ?? 0),
    resumeUrl: String(value.resumeUrl ?? ""),
    resumeFileName: String(value.resumeFileName ?? ""),
    resumeText: String(value.resumeText ?? ""),
    availabilityStatus:
      (value.availabilityStatus as AvailabilityStatus | undefined) ?? "available",
    availabilityType:
      (value.availabilityType as AvailabilityType | undefined) ?? "full-time",
    availabilityStartDate: String(value.availabilityStartDate ?? ""),
    linkedinUrl: String(value.linkedinUrl ?? ""),
    githubUrl: String(value.githubUrl ?? ""),
    portfolioUrl: String(value.portfolioUrl ?? ""),
    skills: splitLineValues(skillsText).map((line) => {
      const [name = "", level = "intermediate", years = "0"] = splitPipeLine(line);
      return {
        name,
        level: level as SkillLevel,
      };
    }),
    languages: splitLineValues(languagesText).map((line) => {
      const [name = "", proficiency = "conversational"] = splitPipeLine(line);
      return {
        name,
        proficiency: proficiency as LanguageProficiency,
      };
    }),
    experience: splitLineValues(experienceText).map((line) => {
      const [
        company = "",
        role = "",
        startDate = "",
        endDate = "",
        description = "",
        technologiesText = "",
        isCurrent = "",
      ] = splitPipeLine(line);
      return {
        company,
        role,
        startDate,
        endDate,
        description,
        technologiesText,
        isCurrent: isCurrent ? toBoolean(isCurrent) : !endDate,
      };
    }),
    education: splitLineValues(educationText).map((line) => {
      const [institution = "", degree = "", fieldOfStudy = "", startYear = "", endYear = ""] =
        splitPipeLine(line);
      return {
        institution,
        degree,
        fieldOfStudy,
        startYear,
        endYear,
      };
    }),
    certifications: splitLineValues(certificationsText).map((line) => {
      const [name = "", issuer = "", issueDate = ""] = splitPipeLine(line);
      return { name, issuer, issueDate };
    }),
    projects: splitLineValues(projectsText).map((line) => {
      const [
        name = "",
        role = "",
        startDate = "",
        endDate = "",
        technologiesText = "",
        link = "",
        description = "",
      ] = splitPipeLine(line);
      return {
        name,
        role,
        startDate,
        endDate,
        technologiesText,
        link,
        description,
      };
    }),
    tagsText: String(value.tagsText ?? ""),
  };
};

export const buildTalentProfileDefaults = (
  user?: Pick<DemoUser, "name" | "email" | "location">
): TalentProfileValues => ({
  fullName: user?.name ?? "",
  headline: "Customer Support Specialist",
  email: user?.email ?? "",
  phone: "",
  location: user?.location ?? "",
  profileSummary:
    "Support-focused professional with strong communication skills, CRM experience, and a track record of resolving customer issues effectively.",
  totalExperienceYears: 2,
  resumeUrl: "",
  resumeFileName: "",
  resumeText: "",
  availabilityStatus: "available",
  availabilityType: "full-time",
  availabilityStartDate: "",
  linkedinUrl: "https://www.linkedin.com/in/elie-demo",
  githubUrl: "",
  portfolioUrl: "https://portfolio.example.com/elie",
  skills: [
    { name: "Customer Support", level: "advanced" },
    { name: "Communication", level: "expert" },
    { name: "CRM Tools", level: "intermediate" },
  ],
  languages: [
    { name: "English", proficiency: "fluent" },
    { name: "Kinyarwanda", proficiency: "native" },
  ],
  experience: [
    {
      company: "Umurava Support Desk",
      role: "Customer Support Associate",
      startDate: "2023-01",
      endDate: "",
      description:
        "Resolved client issues across email and WhatsApp while documenting escalations and improving response quality.",
      technologiesText: "Zendesk, Freshdesk, Google Workspace",
      isCurrent: true,
    },
  ],
  education: [
    {
      institution: "University of Rwanda",
      degree: "Bachelor's",
      fieldOfStudy: "Business Information Technology",
      startYear: "2019",
      endYear: "2023",
    },
  ],
  certifications: [
    {
      name: "Customer Service Foundations",
      issuer: "LinkedIn Learning",
      issueDate: "2024-01",
    },
  ],
  projects: [
    {
      name: "Ticket Resolution Knowledge Base",
      role: "Support Contributor",
      startDate: "2024-01",
      endDate: "",
      technologiesText: "Notion, Google Docs",
      link: "https://example.com",
      description:
        "Built internal response templates and FAQ updates for recurring customer issues.",
    },
  ],
  tagsText: "customer support, communication, crm",
});

export const loadTalentProfileDraft = (
  user?: Pick<DemoUser, "name" | "email" | "location">
): TalentProfileValues => {
  const defaults = buildTalentProfileDefaults(user);
  const scopedStorageKey = getTalentProfileStorageKey(user);

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const scopedRaw = window.localStorage.getItem(scopedStorageKey);
    const legacyRaw = window.localStorage.getItem(talentProfileStorageKey);

    const raw = scopedRaw ?? legacyRaw;
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = Array.isArray(parsed.skills)
      ? (parsed as Partial<TalentProfileValues>)
      : migrateLegacyDraft(parsed);

    const normalizedDraftEmail = String(migrated.email ?? "")
      .trim()
      .toLowerCase();
    const normalizedUserEmail = user?.email?.trim().toLowerCase() ?? "";

    if (
      raw === legacyRaw &&
      normalizedUserEmail &&
      normalizedDraftEmail &&
      normalizedDraftEmail !== normalizedUserEmail
    ) {
      return defaults;
    }

    return {
      ...defaults,
      ...migrated,
      fullName: String(migrated.fullName ?? defaults.fullName),
      email: String(migrated.email ?? defaults.email),
      location: String(migrated.location ?? defaults.location),
      skills: Array.isArray(migrated.skills) ? migrated.skills : defaults.skills,
      languages: Array.isArray(migrated.languages)
        ? migrated.languages
        : defaults.languages,
      experience: Array.isArray(migrated.experience)
        ? migrated.experience
        : defaults.experience,
      education: Array.isArray(migrated.education)
        ? migrated.education
        : defaults.education,
      certifications: Array.isArray(migrated.certifications)
        ? migrated.certifications
        : defaults.certifications,
      projects: Array.isArray(migrated.projects)
        ? migrated.projects
        : defaults.projects,
    };
  } catch {
    return defaults;
  }
};

export const saveTalentProfileDraft = (
  values: TalentProfileValues,
  user?: Pick<DemoUser, "email">
) => {
  if (typeof window === "undefined") {
    return;
  }

  const scopedStorageKey = getTalentProfileStorageKey(user);
  window.localStorage.setItem(scopedStorageKey, JSON.stringify(values));
};

export const clearTalentProfileDraft = (user?: Pick<DemoUser, "email">) => {
  if (typeof window === "undefined") {
    return;
  }

  const scopedStorageKey = getTalentProfileStorageKey(user);
  window.localStorage.removeItem(scopedStorageKey);
};

export const estimateTalentProfileCompletion = (values: TalentProfileValues) => {
  const checks = [
    Boolean(values.fullName.trim()),
    Boolean(values.headline.trim()),
    Boolean(values.email.trim()),
    Boolean(values.location.trim()),
    Boolean(values.profileSummary.trim()),
    values.totalExperienceYears > 0,
    values.skills.some((item) => item.name.trim()),
    values.experience.some((item) => item.company.trim() && item.role.trim()),
    values.education.some((item) => item.institution.trim() && item.degree.trim()),
    values.languages.some((item) => item.name.trim()),
    values.availabilityStatus !== "not-available",
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

export const buildTalentProfilePayload = (
  values: TalentProfileValues
): CreateApplicantInput => ({
  fullName: values.fullName.trim(),
  headline: values.headline.trim(),
  email: values.email.trim(),
  phone: values.phone.trim(),
  location: values.location.trim(),
  source: "platform",
  resumeUrl: values.resumeUrl.trim(),
  resumeFileName: values.resumeFileName.trim(),
  resumeText: values.resumeText.trim(),
  profileSummary: values.profileSummary.trim(),
  totalExperienceYears: Number(values.totalExperienceYears) || 0,
  skills: values.skills
    .filter((item) => item.name.trim())
    .map((item) => ({
      name: item.name.trim(),
      level: item.level,
      yearsOfExperience: estimateSkillYearsOfExperience(
        values.totalExperienceYears,
        item.level
      ),
    })),
  languages: values.languages
    .filter((item) => item.name.trim())
    .map((item) => ({
      name: item.name.trim(),
      proficiency: item.proficiency,
    })),
  education: values.education
    .filter((item) => item.institution.trim() && item.degree.trim() && item.fieldOfStudy.trim())
    .map((item) => ({
      institution: item.institution.trim(),
      degree: item.degree.trim(),
      fieldOfStudy: item.fieldOfStudy.trim(),
      startYear: toNumber(item.startYear),
      endYear: toNumber(item.endYear),
    })),
  experience: values.experience
    .filter(
      (item) =>
        item.company.trim() &&
        item.role.trim() &&
        item.startDate.trim() &&
        item.description.trim()
    )
    .map((item) => ({
      company: item.company.trim(),
      role: item.role.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      description: item.description.trim(),
      technologies: splitCommaValues(item.technologiesText),
      isCurrent: item.isCurrent,
    })),
  certifications: values.certifications
    .filter((item) => item.name.trim() && item.issuer.trim())
    .map((item) => ({
      name: item.name.trim(),
      issuer: item.issuer.trim(),
      issueDate: item.issueDate.trim(),
    })),
  projects: values.projects
    .filter(
      (item) =>
        item.name.trim() &&
        item.role.trim() &&
        item.startDate.trim() &&
        item.description.trim()
    )
    .map((item) => ({
      name: item.name.trim(),
      role: item.role.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim(),
      technologies: splitCommaValues(item.technologiesText),
      link: item.link.trim(),
      description: item.description.trim(),
    })),
  availability: {
    status: values.availabilityStatus,
    type: values.availabilityType,
    startDate: values.availabilityStartDate.trim(),
  },
  socialLinks: Object.fromEntries(
    [
      ["linkedin", values.linkedinUrl.trim()],
      ["github", values.githubUrl.trim()],
      ["portfolio", values.portfolioUrl.trim()],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  ),
  tags: splitCommaValues(values.tagsText),
});

export const talentProfileFactories = {
  blankSkill,
  blankLanguage,
  blankExperience,
  blankEducation,
  blankCertification,
  blankProject,
};
