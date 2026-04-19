import type {
  DashboardJobSnapshot,
  JobRecord,
} from "@umurava/shared";

import type { TalentProfileValues } from "./talent-profile";

export type TalentJobSuggestion = {
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
  matchedKeywords: string[];
  matchedEducation: string[];
  reasons: string[];
};

const stopWords = new Set([
  "about",
  "across",
  "after",
  "already",
  "alongside",
  "candidate",
  "candidates",
  "company",
  "customer",
  "deliver",
  "experience",
  "from",
  "have",
  "ideal",
  "into",
  "join",
  "looking",
  "role",
  "team",
  "their",
  "this",
  "through",
  "with",
  "work",
  "years",
]);

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesPhrase = (haystack: string, needle: string) => {
  const normalizedNeedle = normalizeText(needle);
  if (!normalizedNeedle) {
    return false;
  }

  return haystack.includes(normalizedNeedle);
};

const extractKeywords = (value: string) =>
  Array.from(
    new Set(
      normalizeText(value)
        .split(/\s+/)
        .filter(
          (item) => item.length >= 3 && !stopWords.has(item)
        )
    )
  );

const buildProfileSearchText = (profile: TalentProfileValues) =>
  normalizeText(
    [
      profile.headline,
      profile.profileSummary,
      profile.resumeText,
      profile.tagsText,
      profile.skills.map((item) => item.name).join(" "),
      profile.languages.map((item) => item.name).join(" "),
      profile.experience
        .map((item) =>
          [
            item.company,
            item.role,
            item.description,
            item.technologiesText,
          ].join(" ")
        )
        .join(" "),
      profile.education
        .map((item) =>
          [item.institution, item.degree, item.fieldOfStudy].join(" ")
        )
        .join(" "),
      profile.certifications.map((item) => item.name).join(" "),
      profile.projects
        .map((item) =>
          [item.name, item.role, item.description, item.technologiesText].join(" ")
        )
        .join(" "),
    ].join(" ")
  );

export const scoreTalentJobFit = (
  profile: TalentProfileValues,
  job: JobRecord
): TalentJobSuggestion => {
  const profileText = buildProfileSearchText(profile);
  const savedSkillNames = new Set(
    profile.skills
      .map((item) => normalizeText(item.name))
      .filter(Boolean)
  );
  const educationText = normalizeText(
    profile.education
      .map((item) =>
        [item.institution, item.degree, item.fieldOfStudy].join(" ")
      )
      .join(" ")
  );
  const jobKeywords = extractKeywords(
    [
      job.title,
      job.department,
      job.summary,
      job.idealCandidate,
      ...job.requiredSkills.map((item) => item.name),
      ...job.educationPreferences,
    ].join(" ")
  ).slice(0, 14);

  const matchedSkills = job.requiredSkills
    .filter(
      (item) =>
        savedSkillNames.has(normalizeText(item.name)) ||
        includesPhrase(profileText, item.name)
    )
    .map((item) => item.name);

  const matchedEducation = job.educationPreferences.filter((item) =>
    includesPhrase(`${educationText} ${profileText}`, item)
  );

  const matchedKeywords = jobKeywords.filter((item) =>
    includesPhrase(profileText, item)
  );

  const skillScore =
    job.requiredSkills.length > 0
      ? (matchedSkills.length / job.requiredSkills.length) * 100
      : 100;
  const experienceScore =
    job.minimumExperienceYears > 0
      ? Math.min(
          (Math.max(profile.totalExperienceYears, 0) /
            job.minimumExperienceYears) *
            100,
          100
        )
      : 100;
  const educationScore =
    job.educationPreferences.length > 0
      ? (matchedEducation.length / job.educationPreferences.length) * 100
      : 100;
  const relevanceScore =
    jobKeywords.length > 0
      ? Math.min((matchedKeywords.length / jobKeywords.length) * 100, 100)
      : 100;

  const matchScore = Math.round(
    skillScore * 0.5 +
      experienceScore * 0.2 +
      educationScore * 0.1 +
      relevanceScore * 0.2
  );

  const reasons: string[] = [];

  if (matchedSkills.length > 0) {
    reasons.push(
      `${matchedSkills.length} required skill${
        matchedSkills.length === 1 ? "" : "s"
      } already appear in your profile or CV.`
    );
  }

  if (profile.totalExperienceYears >= job.minimumExperienceYears) {
    reasons.push(
      `Your experience level meets the ${job.minimumExperienceYears}+ year target for this role.`
    );
  }

  if (matchedEducation.length > 0) {
    reasons.push(
      "Your education history lines up with the job preference."
    );
  }

  if (matchedKeywords.length > 0) {
    reasons.push(
      "Your profile summary and CV language align with the role description."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "Your saved profile gives a starting signal, but adding more CV and project detail will improve job matching."
    );
  }

  return {
    jobId: job.id,
    matchScore,
    matchedSkills,
    matchedKeywords,
    matchedEducation,
    reasons,
  };
};

export const buildTalentJobSuggestions = (
  profile: TalentProfileValues,
  jobs: DashboardJobSnapshot[]
) =>
  jobs
    .map((snapshot) => ({
      snapshot,
      suggestion: scoreTalentJobFit(profile, snapshot.job),
    }))
    .sort(
      (left, right) =>
        right.suggestion.matchScore - left.suggestion.matchScore ||
        new Date(right.snapshot.job.updatedAt).getTime() -
          new Date(left.snapshot.job.updatedAt).getTime()
    );
