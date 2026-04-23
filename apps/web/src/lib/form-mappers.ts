import type {
  AvailabilityStatus,
  AvailabilityType,
  CreateApplicantInput,
  CreateJobInput,
  JobRecord,
  LanguageProficiency,
  SkillLevel,
} from "@umurava/shared";

type JobFormSkill = {
  name: string;
  requiredLevel: SkillLevel;
};

export type JobFormValues = {
  title: string;
  department: string;
  location: string;
  employmentType: CreateJobInput["employmentType"];
  summary: string;
  idealCandidate: string;
  minimumExperienceYears: number;
  shortlistLimit: number;
  educationPreferencesText: string;
  requiredSkills: JobFormSkill[];
};

export type ApplicantFormValues = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  profileSummary: string;
  totalExperienceYears: number;
  resumeUrl: string;
  availabilityStatus: AvailabilityStatus;
  availabilityType: AvailabilityType;
  availabilityStartDate: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  skillsText: string;
  languagesText: string;
  experienceText: string;
  educationText: string;
  certificationsText: string;
  projectsText: string;
  tagsText: string;
};

export const splitCommaValues = (value: string): string[] =>
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

const toNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: string): boolean =>
  ["true", "yes", "1", "current", "present"].includes(value.trim().toLowerCase());

export const buildJobFormValues = (job?: JobRecord): JobFormValues => ({
  title: job?.title ?? "",
  department: job?.department ?? "",
  location: job?.location ?? "",
  employmentType: job?.employmentType ?? "full-time",
  summary: job?.summary ?? "",
  idealCandidate: job?.idealCandidate ?? "",
  minimumExperienceYears: job?.minimumExperienceYears ?? 0,
  shortlistLimit: job?.shortlistLimit ?? 10,
  educationPreferencesText: (job?.educationPreferences ?? []).join(", "),
  requiredSkills:
    job?.requiredSkills.map((skill) => ({
      name: skill.name,
      requiredLevel: skill.requiredLevel,
    })) ?? [{ name: "", requiredLevel: "intermediate" }],
});

export const buildJobPayload = (values: JobFormValues): CreateJobInput => ({
  title: values.title.trim(),
  department: values.department.trim(),
  location: values.location.trim(),
  employmentType: values.employmentType,
  summary: values.summary.trim(),
  idealCandidate: values.idealCandidate.trim(),
  minimumExperienceYears: Number(values.minimumExperienceYears),
  shortlistLimit: Number(values.shortlistLimit),
  educationPreferences: splitCommaValues(values.educationPreferencesText),
  requiredSkills: values.requiredSkills
    .filter((skill) => skill.name.trim())
    .map((skill) => ({
      name: skill.name.trim(),
      requiredLevel: skill.requiredLevel,
      required: true,
    })),
});

export const buildApplicantPayload = (
  values: ApplicantFormValues
): CreateApplicantInput => {
  const socialLinks = Object.fromEntries(
    [
      ["linkedin", values.linkedinUrl.trim()],
      ["github", values.githubUrl.trim()],
      ["portfolio", values.portfolioUrl.trim()],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  return {
    fullName: values.fullName.trim(),
    headline: values.headline.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    location: values.location.trim(),
    source: "manual",
    resumeUrl: values.resumeUrl.trim(),
    resumeText: "",
    profileSummary: values.profileSummary.trim(),
    totalExperienceYears: Number(values.totalExperienceYears),
    skills: splitLineValues(values.skillsText)
      .map((line) => {
        const [name = "", level = "intermediate", years = "0"] = splitPipeLine(line);
        return {
          name,
          level: level as SkillLevel,
          yearsOfExperience: Number(years) || 0,
        };
      })
      .filter((item) => item.name),
    languages: splitLineValues(values.languagesText)
      .map((line) => {
        const [name = "", proficiency = "conversational"] = splitPipeLine(line);
        return {
          name,
          proficiency: proficiency as LanguageProficiency,
        };
      })
      .filter((item) => item.name),
    education: splitLineValues(values.educationText)
      .map((line) => {
        const [institution = "", degree = "", fieldOfStudy = "", startYear = "", endYear = ""] =
          splitPipeLine(line);
        return {
          institution,
          degree,
          fieldOfStudy,
          startYear: toNumber(startYear),
          endYear: toNumber(endYear),
        };
      })
      .filter((item) => item.institution && item.degree && item.fieldOfStudy),
    experience: splitLineValues(values.experienceText)
      .map((line) => {
        const [
          company = "",
          role = "",
          startDate = "",
          endDate = "",
          description = "",
          technologies = "",
          isCurrent = "",
        ] = splitPipeLine(line);
        return {
          company,
          role,
          startDate,
          endDate,
          description,
          technologies: splitCommaValues(technologies),
          isCurrent: isCurrent ? toBoolean(isCurrent) : !endDate,
        };
      })
      .filter((item) => item.company && item.role && item.startDate && item.description),
    certifications: splitLineValues(values.certificationsText)
      .map((line) => {
        const [name = "", issuer = "", issueDate = ""] = splitPipeLine(line);
        return {
          name,
          issuer,
          issueDate,
        };
      })
      .filter((item) => item.name && item.issuer),
    projects: splitLineValues(values.projectsText)
      .map((line) => {
        const [
          name = "",
          role = "",
          startDate = "",
          endDate = "",
          technologies = "",
          link = "",
          description = "",
        ] = splitPipeLine(line);
        return {
          name,
          role,
          startDate,
          endDate,
          technologies: splitCommaValues(technologies),
          link,
          description,
        };
      })
      .filter((item) => item.name && item.role && item.startDate && item.description),
    availability: {
      status: values.availabilityStatus,
      type: values.availabilityType,
      startDate: values.availabilityStartDate.trim(),
    },
    socialLinks,
    tags: splitCommaValues(values.tagsText),
  };
};
