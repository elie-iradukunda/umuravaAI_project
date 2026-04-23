import type {
  AvailabilityStatus,
  AvailabilityType,
  CreateApplicantInput,
  LanguageProficiency,
  SkillLevel,
  TalentProfileRecord,
} from "@umurava/shared";

export type TalentProfileUser = {
  name?: string;
  email?: string;
  location?: string;
};

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

const splitCommaValues = (value: string): string[] =>
  value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string | number | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

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

export const buildTalentProfileDefaults = (
  user?: TalentProfileUser
): TalentProfileValues => ({
  fullName: user?.name ?? "",
  headline: "",
  email: user?.email ?? "",
  phone: "",
  location: user?.location ?? "",
  profileSummary: "",
  totalExperienceYears: 0,
  resumeUrl: "",
  resumeFileName: "",
  resumeText: "",
  availabilityStatus: "open-to-opportunities",
  availabilityType: "full-time",
  availabilityStartDate: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  skills: [blankSkill()],
  languages: [blankLanguage()],
  experience: [blankExperience()],
  education: [blankEducation()],
  certifications: [blankCertification()],
  projects: [blankProject()],
  tagsText: "",
});

export const buildTalentProfileValues = (
  profile?: TalentProfileRecord | null,
  user?: TalentProfileUser
): TalentProfileValues => {
  const defaults = buildTalentProfileDefaults(user);

  if (!profile) {
    return defaults;
  }

  return {
    ...defaults,
    fullName: profile.fullName || defaults.fullName,
    headline: profile.headline || "",
    email: profile.email || defaults.email,
    phone: profile.phone || "",
    location: profile.location || defaults.location,
    profileSummary: profile.profileSummary || "",
    totalExperienceYears: profile.totalExperienceYears || 0,
    resumeUrl: profile.resumeUrl || "",
    resumeFileName: profile.resumeFileName || "",
    resumeText: profile.resumeText || "",
    availabilityStatus: profile.availability.status,
    availabilityType: profile.availability.type,
    availabilityStartDate: profile.availability.startDate || "",
    linkedinUrl: profile.socialLinks.linkedin || "",
    githubUrl: profile.socialLinks.github || "",
    portfolioUrl: profile.socialLinks.portfolio || "",
    skills:
      profile.skills.length > 0
        ? profile.skills.map((item) => ({
            name: item.name,
            level: item.level,
          }))
        : defaults.skills,
    languages:
      profile.languages.length > 0
        ? profile.languages.map((item) => ({
            name: item.name,
            proficiency: item.proficiency,
          }))
        : defaults.languages,
    experience:
      profile.experience.length > 0
        ? profile.experience.map((item) => ({
            company: item.company,
            role: item.role,
            startDate: item.startDate,
            endDate: item.endDate || "",
            description: item.description,
            technologiesText: item.technologies.join(", "),
            isCurrent: item.isCurrent,
          }))
        : defaults.experience,
    education:
      profile.education.length > 0
        ? profile.education.map((item) => ({
            institution: item.institution,
            degree: item.degree,
            fieldOfStudy: item.fieldOfStudy,
            startYear: item.startYear == null ? "" : String(item.startYear),
            endYear: item.endYear == null ? "" : String(item.endYear),
          }))
        : defaults.education,
    certifications:
      profile.certifications.length > 0
        ? profile.certifications.map((item) => ({
            name: item.name,
            issuer: item.issuer,
            issueDate: item.issueDate || "",
          }))
        : defaults.certifications,
    projects:
      profile.projects.length > 0
        ? profile.projects.map((item) => ({
            name: item.name,
            role: item.role,
            startDate: item.startDate,
            endDate: item.endDate || "",
            technologiesText: item.technologies.join(", "),
            link: item.link || "",
            description: item.description,
          }))
        : defaults.projects,
    tagsText: profile.tags.join(", "),
  };
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
