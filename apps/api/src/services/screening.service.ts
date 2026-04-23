import { randomUUID } from "node:crypto";

import type {
  ApplicantRecord,
  CandidateReasoning,
  JobRecord,
  ScreeningBreakdown,
  ScreeningConfidence,
  ScreeningDecision,
  ScreeningOverview,
  ScreeningProvider,
  ScreeningRiskLevel,
  ScreeningResultRecord,
  SkillLevel,
} from "@umurava/shared";

import { env } from "../config/env.js";
import type { Repository } from "../repositories/types.js";
import {
  isGeminiConfigured,
  screenApplicantWithGemini,
  toGeminiHttpError,
} from "./gemini.service.js";

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

const getMatchedSkills = (
  job: JobRecord,
  applicant: ApplicantRecord
): string[] =>
  job.requiredSkills
    .filter((skill) => findApplicantSkill(applicant, skill.name))
    .map((skill) => skill.name);

const getMissingSkills = (
  job: JobRecord,
  applicant: ApplicantRecord
): string[] =>
  job.requiredSkills
    .filter((skill) => !findApplicantSkill(applicant, skill.name))
    .map((skill) => skill.name);

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
  const matchedSkills = getMatchedSkills(job, applicant);
  const missingSkills = getMissingSkills(job, applicant);

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

const computeFinalScore = (breakdown: ScreeningBreakdown): number =>
  Number(
    (
      breakdown.skills * 0.4 +
      breakdown.experience * 0.3 +
      breakdown.education * 0.15 +
      breakdown.relevance * 0.15
    ).toFixed(1)
  );

type ScreeningSignals = {
  decision: NonNullable<ScreeningResultRecord["decision"]>;
  confidence: NonNullable<ScreeningResultRecord["confidence"]>;
  riskLevel: NonNullable<ScreeningResultRecord["riskLevel"]>;
  matchedSkills: ScreeningResultRecord["matchedSkills"];
  missingSkills: ScreeningResultRecord["missingSkills"];
};

const getConfidence = (finalScore: number): ScreeningConfidence => {
  if (finalScore >= 80) {
    return "high";
  }

  if (finalScore >= 65) {
    return "medium";
  }

  return "low";
};

const getDecision = (finalScore: number): ScreeningDecision =>
  finalScore >= 80 ? "strong-shortlist" : "shortlist";

const getRiskLevel = (
  job: JobRecord,
  applicant: ApplicantRecord,
  breakdown: ScreeningBreakdown,
  finalScore: number,
  missingSkills: string[]
): ScreeningRiskLevel => {
  let riskPoints = 0;

  if (finalScore < 60) {
    riskPoints += 3;
  } else if (finalScore < 70) {
    riskPoints += 2;
  } else if (finalScore < 80) {
    riskPoints += 1;
  }

  if (missingSkills.length >= 3) {
    riskPoints += 2;
  } else if (missingSkills.length > 0) {
    riskPoints += 1;
  }

  if (applicant.totalExperienceYears < job.minimumExperienceYears) {
    riskPoints += 2;
  }

  if (breakdown.relevance < 55) {
    riskPoints += 1;
  }

  if (job.educationPreferences.length > 0 && breakdown.education < 45) {
    riskPoints += 1;
  }

  if (riskPoints >= 5) {
    return "high";
  }

  if (riskPoints >= 2) {
    return "medium";
  }

  return "low";
};

const buildScreeningSignals = (
  job: JobRecord,
  applicant: ApplicantRecord,
  breakdown: ScreeningBreakdown,
  finalScore: number
): ScreeningSignals => {
  const matchedSkills = getMatchedSkills(job, applicant);
  const missingSkills = getMissingSkills(job, applicant);

  return {
    decision: getDecision(finalScore),
    confidence: getConfidence(finalScore),
    riskLevel: getRiskLevel(job, applicant, breakdown, finalScore, missingSkills),
    matchedSkills,
    missingSkills,
  };
};

const buildTopCandidateSummary = (
  job: JobRecord,
  screening: ScreeningResultRecord,
  applicant: ApplicantRecord | undefined
): string => {
  const name = applicant?.fullName ?? "Unknown candidate";
  const skillsText =
    screening.matchedSkills.length > 0
      ? screening.matchedSkills.slice(0, 3).join(", ")
      : "transferable experience";

  return `${screening.rank}. ${name} scored ${screening.matchScore}% for ${job.title}, with standout alignment in ${skillsText}. ${screening.reasoning.recommendation}`;
};

const buildOverallJobFitSummary = (
  job: JobRecord,
  applicants: ApplicantRecord[],
  screenings: ScreeningResultRecord[]
): string => {
  const totalApplicants = applicants.length;
  const shortlistedCount = screenings.length;
  const rejectedCount = Math.max(totalApplicants - shortlistedCount, 0);
  const averageMatchScore =
    screenings.length === 0
      ? 0
      : Number(
          (
            screenings.reduce((sum, item) => sum + item.matchScore, 0) /
            screenings.length
          ).toFixed(1)
        );
  const topScreening = screenings[0];
  const topApplicant = applicants.find(
    (applicant) => applicant.id === topScreening?.applicantId
  );

  const poolSignal =
    (topScreening?.matchScore ?? 0) >= 80
      ? "The current pool includes at least one standout option ready for fast recruiter review."
      : (topScreening?.matchScore ?? 0) >= 65
        ? "The shortlist has workable options, but interview validation should stay focused on remaining gaps."
        : "The pool is thin right now, so recruiter review should balance current fit with sourcing follow-up.";

  const skillGapCount = screenings.filter(
    (item) => item.missingSkills.length > 0
  ).length;
  const gapSignal =
    skillGapCount === 0
      ? "Required-skill coverage is strong across the shortlisted candidates."
      : `${skillGapCount} shortlisted candidate${
          skillGapCount === 1 ? "" : "s"
        } still show at least one notable skill gap that should be checked in interviews.`;

  return `${totalApplicants} applicants were screened for ${job.title}. ${shortlistedCount} candidate${
    shortlistedCount === 1 ? "" : "s"
  } landed in the shortlist while ${rejectedCount} were not advanced, and the shortlisted average sits at ${averageMatchScore}%. ${
    topApplicant && topScreening
      ? `${topApplicant.fullName} currently leads the pool at ${topScreening.matchScore}%. `
      : ""
  }${poolSignal} ${gapSignal}`;
};

export const buildScreeningOverview = (
  job: JobRecord,
  applicants: ApplicantRecord[],
  screenings: ScreeningResultRecord[]
): ScreeningOverview | null => {
  if (applicants.length === 0 || screenings.length === 0) {
    return null;
  }

  const averageMatchScore = Number(
    (
      screenings.reduce((sum, item) => sum + item.matchScore, 0) /
      screenings.length
    ).toFixed(1)
  );

  return {
    generatedAt: screenings[0]?.createdAt ?? new Date().toISOString(),
    provider: screenings[0]?.provider ?? env.SCREENING_PROVIDER,
    totalApplicants: applicants.length,
    shortlistedCount: screenings.length,
    rejectedCount: Math.max(applicants.length - screenings.length, 0),
    averageMatchScore,
    overallJobFitSummary: buildOverallJobFitSummary(job, applicants, screenings),
    topCandidateSummaries: screenings
      .slice(0, 3)
      .map((screening) =>
        buildTopCandidateSummary(
          job,
          screening,
          applicants.find((applicant) => applicant.id === screening.applicantId)
        )
      ),
  };
};

const toScreeningRecords = (
  job: JobRecord,
  entries: Array<{
    applicant: ApplicantRecord;
    breakdown: ScreeningBreakdown;
    finalScore: number;
    reasoning: CandidateReasoning;
    provider: ScreeningProvider;
    decision: ScreeningSignals["decision"];
    confidence: ScreeningSignals["confidence"];
    riskLevel: ScreeningSignals["riskLevel"];
    matchedSkills: ScreeningSignals["matchedSkills"];
    missingSkills: ScreeningSignals["missingSkills"];
  }>
): ScreeningResultRecord[] =>
  entries
    .sort((left, right) => right.finalScore - left.finalScore)
    .slice(0, job.shortlistLimit)
    .map((entry, index) => ({
      id: `screening_${randomUUID()}`,
      jobId: job.id,
      applicantId: entry.applicant.id,
      provider: entry.provider,
      rank: index + 1,
      matchScore: entry.finalScore,
      breakdown: entry.breakdown,
      reasoning: entry.reasoning,
      decision: entry.decision,
      confidence: entry.confidence,
      riskLevel: entry.riskLevel,
      matchedSkills: entry.matchedSkills,
      missingSkills: entry.missingSkills,
      createdAt: new Date().toISOString(),
    }));

const assertGeminiReady = (): void => {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is missing in apps/api/.env.");
  }
};

const buildGeminiScreenings = async (
  job: JobRecord,
  applicants: ApplicantRecord[]
): Promise<ScreeningResultRecord[]> => {
  const evaluations = await Promise.all(
    applicants.map(async (applicant) => {
      const assessment = await screenApplicantWithGemini(job, applicant);
      const finalScore = computeFinalScore(assessment.breakdown);
      const signals = buildScreeningSignals(
        job,
        applicant,
        assessment.breakdown,
        finalScore
      );

      return {
        applicant,
        breakdown: assessment.breakdown,
        finalScore,
        reasoning: assessment.reasoning,
        provider: "gemini" as const,
        ...signals,
      };
    })
  );

  return toScreeningRecords(job, evaluations);
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

  assertGeminiReady();

  let screenings: ScreeningResultRecord[];

  try {
    screenings = await buildGeminiScreenings(job, applicants);
  } catch (error) {
    throw toGeminiHttpError(
      error,
      "Gemini could not complete the screening run right now."
    );
  }

  await repository.replaceScreenings(jobId, screenings);
  await repository.markApplicantsScreened(jobId);
  return screenings;
};
