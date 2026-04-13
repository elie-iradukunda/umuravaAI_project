import { randomUUID } from "node:crypto";

import type {
  ApplicantRecord,
  CandidateReasoning,
  JobRecord,
  ScreeningBreakdown,
  ScreeningProvider,
  ScreeningResultRecord,
  SkillLevel,
} from "@umurava/shared";

import { env } from "../config/env.js";
import type { Repository } from "../repositories/types.js";

const skillLevelScore: Record<SkillLevel, number> = {
  beginner: 0.4,
  intermediate: 0.65,
  advanced: 0.85,
  expert: 1,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const toKeywordTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

const containsLoose = (left: string, right: string): boolean => {
  const normalizedLeft = left.toLowerCase().trim();
  const normalizedRight = right.toLowerCase().trim();
  return (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};

const findApplicantSkill = (
  applicant: ApplicantRecord,
  skillName: string
): ApplicantRecord["skills"][number] | undefined =>
  applicant.skills.find((skill) => containsLoose(skill.name, skillName));

const getSkillScore = (
  job: JobRecord,
  applicant: ApplicantRecord
): ScreeningBreakdown["skills"] => {
  const totalWeight =
    job.requiredSkills.reduce(
      (sum, skill) => sum + (skill.weight ?? 1 / job.requiredSkills.length),
      0
    ) || 1;

  const weightedScore = job.requiredSkills.reduce((sum, skill) => {
    const candidateSkill = findApplicantSkill(applicant, skill.name);
    const requiredLevel = skillLevelScore[skill.requiredLevel];
    const candidateLevel = candidateSkill
      ? skillLevelScore[candidateSkill.level]
      : 0;
    const yearsFactor = candidateSkill
      ? clamp(candidateSkill.yearsOfExperience / 3, 0.4, 1)
      : 0;
    const score = candidateSkill
      ? clamp((candidateLevel / requiredLevel) * yearsFactor, 0, 1)
      : 0;
    return sum + score * (skill.weight ?? 1 / job.requiredSkills.length);
  }, 0);

  return Number(((weightedScore / totalWeight) * 100).toFixed(1));
};

const getExperienceScore = (
  job: JobRecord,
  applicant: ApplicantRecord
): ScreeningBreakdown["experience"] => {
  if (job.minimumExperienceYears === 0) {
    return 100;
  }

  const ratio = applicant.totalExperienceYears / job.minimumExperienceYears;
  return Number((clamp(ratio, 0, 1.2) / 1.2 * 100).toFixed(1));
};

const getEducationScore = (
  job: JobRecord,
  applicant: ApplicantRecord
): ScreeningBreakdown["education"] => {
  if (job.educationPreferences.length === 0) {
    return 100;
  }

  const applicantEducation = applicant.education
    .map((item) => `${item.degree} ${item.fieldOfStudy}`)
    .join(" ")
    .toLowerCase();

  const matches = job.educationPreferences.filter((preference) =>
    applicantEducation.includes(preference.toLowerCase())
  ).length;

  if (matches === 0) {
    return applicant.education.length > 0 ? 45 : 20;
  }

  return Number(
    ((matches / job.educationPreferences.length) * 100).toFixed(1)
  );
};

const getRelevanceScore = (
  job: JobRecord,
  applicant: ApplicantRecord
): ScreeningBreakdown["relevance"] => {
  const keywords = new Set<string>([
    ...toKeywordTokens(job.title),
    ...job.requiredSkills.flatMap((skill) => toKeywordTokens(skill.name)),
    ...toKeywordTokens(job.summary),
    ...toKeywordTokens(job.idealCandidate),
  ]);

  const profileCorpus = [
    applicant.profileSummary,
    applicant.resumeText,
    applicant.tags.join(" "),
    applicant.experience
      .map((item) => `${item.role} ${item.description} ${item.technologies.join(" ")}`)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

  if (keywords.size === 0) {
    return 100;
  }

  const matched = [...keywords].filter((keyword) => profileCorpus.includes(keyword))
    .length;

  return Number(((matched / keywords.size) * 100).toFixed(1));
};

const buildReasoning = (
  job: JobRecord,
  applicant: ApplicantRecord,
  breakdown: ScreeningBreakdown,
  finalScore: number
): CandidateReasoning => {
  const matchedSkills = job.requiredSkills
    .filter((skill) => findApplicantSkill(applicant, skill.name))
    .map((skill) => skill.name);

  const missingSkills = job.requiredSkills
    .filter((skill) => !findApplicantSkill(applicant, skill.name))
    .map((skill) => skill.name);

  const strengths = [
    matchedSkills.length > 0
      ? `Matches ${matchedSkills.length} priority skills, including ${matchedSkills
          .slice(0, 3)
          .join(", ")}.`
      : "Shows some transferable potential from the submitted profile.",
    applicant.totalExperienceYears >= job.minimumExperienceYears
      ? `Meets the experience bar with ${applicant.totalExperienceYears} years against a ${job.minimumExperienceYears}-year target.`
      : `Brings ${applicant.totalExperienceYears} years of experience with relevant overlap in the role area.`,
    breakdown.relevance >= 60
      ? "Profile language aligns well with the role scope and recruiter workflow needs."
      : "Relevant signals exist, but the profile could be more tailored to the role scope.",
  ].filter(Boolean);

  const gaps = [
    missingSkills.length > 0
      ? `Missing or unclear evidence for ${missingSkills.slice(0, 3).join(", ")}.`
      : "",
    applicant.totalExperienceYears < job.minimumExperienceYears
      ? `Falls short of the target experience by ${(
          job.minimumExperienceYears - applicant.totalExperienceYears
        ).toFixed(1)} years.`
      : "",
    breakdown.education < 50
      ? "Education background does not clearly match the preferred fields."
      : "",
  ].filter(Boolean);

  if (gaps.length === 0) {
    gaps.push("No major gaps detected at shortlist stage; validate depth during interview.");
  }

  let recommendation =
    "Keep under review until stronger evidence is available.";
  if (finalScore >= 80) {
    recommendation =
      "Strong shortlist candidate. Prioritize for recruiter review and interview planning.";
  } else if (finalScore >= 65) {
    recommendation =
      "Solid shortlist option. Worth advancing if the team can validate the remaining gaps.";
  } else if (finalScore >= 50) {
    recommendation =
      "Borderline fit. Consider as a backup option if the pool is limited.";
  }

  return {
    summary: `${applicant.fullName} shows a ${finalScore}% overall fit for ${job.title}, combining ${matchedSkills.length} matched priority skills with ${applicant.totalExperienceYears} years of experience.`,
    strengths,
    gaps,
    recommendation,
  };
};

const buildMockScreenings = (
  job: JobRecord,
  applicants: ApplicantRecord[]
): ScreeningResultRecord[] => {
  const shortlisted = applicants
    .map((applicant) => {
      const breakdown: ScreeningBreakdown = {
        skills: getSkillScore(job, applicant),
        experience: getExperienceScore(job, applicant),
        education: getEducationScore(job, applicant),
        relevance: getRelevanceScore(job, applicant),
      };

      const finalScore = Number(
        (
          breakdown.skills * 0.4 +
          breakdown.experience * 0.3 +
          breakdown.education * 0.15 +
          breakdown.relevance * 0.15
        ).toFixed(1)
      );

      return {
        applicant,
        breakdown,
        finalScore,
        reasoning: buildReasoning(job, applicant, breakdown, finalScore),
      };
    })
    .sort((left, right) => right.finalScore - left.finalScore)
    .slice(0, job.shortlistLimit);

  return shortlisted.map((entry, index) => ({
    id: `screening_${randomUUID()}`,
    jobId: job.id,
    applicantId: entry.applicant.id,
    provider: "mock",
    rank: index + 1,
    matchScore: entry.finalScore,
    breakdown: entry.breakdown,
    reasoning: entry.reasoning,
    createdAt: new Date().toISOString(),
  }));
};

const assertProviderReady = (provider: ScreeningProvider): void => {
  if (provider === "gemini") {
    throw new Error(
      "Gemini screening is not connected yet. Use the mock provider until the API integration is added."
    );
  }
};

export const runScreeningForJob = async (
  repository: Repository,
  jobId: string
): Promise<ScreeningResultRecord[]> => {
  const job = await repository.getJob(jobId);
  if (!job) {
    throw new Error("Job not found.");
  }

  const applicants = await repository.listApplicants(jobId);
  if (applicants.length === 0) {
    throw new Error("Add applicants before running screening.");
  }

  assertProviderReady(env.SCREENING_PROVIDER);

  const screenings = buildMockScreenings(job, applicants);
  await repository.replaceScreenings(jobId, screenings);
  await repository.markApplicantsScreened(jobId);
  return screenings;
};
