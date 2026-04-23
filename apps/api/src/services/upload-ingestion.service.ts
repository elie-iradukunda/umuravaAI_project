import path from "node:path";

import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import pdfParse from "pdf-parse";
import type { CreateApplicantInput } from "@umurava/shared";

import {
  extractApplicantFromResumePdf,
  extractResumeTextFromPdf,
  isGeminiConfigured,
} from "./gemini.service.js";

type UploadOutcome = {
  applicants: CreateApplicantInput[];
  warnings: string[];
};

export type TalentResumeUploadResult = {
  fileName: string;
  resumeText: string;
  summaryExcerpt: string;
};

type NormalizedUploadRow = Record<string, unknown>;

const toString = (value: unknown): string => {
  if (value == null) {
    return "";
  }

  return String(value).trim();
};

const toNumber = (value: unknown): number => {
  const stringValue = toString(value);
  if (!stringValue) {
    return 0;
  }

  const parsed = Number(stringValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toOptionalYear = (value: unknown): number | undefined => {
  const parsed = toNumber(value);

  if (!parsed) {
    return undefined;
  }

  const rounded = Math.trunc(parsed);
  return rounded >= 1900 && rounded <= 2100 ? rounded : undefined;
};

const splitList = (value: unknown): string[] =>
  toString(value)
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitEntries = (value: unknown): string[] => {
  const text = toString(value);

  if (!text) {
    return [];
  }

  return text
    .split(/[;\n]+/)
    .flatMap((entry) => {
      const trimmedEntry = entry.trim();

      if (!trimmedEntry) {
        return [];
      }

      if (trimmedEntry.includes("|")) {
        return [trimmedEntry];
      }

      return trimmedEntry
        .split(/[,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    });
};

const normalizeRowKey = (value: string): string =>
  value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const normalizeUploadRow = (
  row: Record<string, unknown>
): NormalizedUploadRow => {
  const normalized: NormalizedUploadRow = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeRowKey(key);

    if (!normalizedKey) {
      return;
    }

    const currentValue = normalized[normalizedKey];
    if (currentValue == null || !toString(currentValue)) {
      normalized[normalizedKey] = value;
    }
  });

  return normalized;
};

const getRowValue = (
  row: NormalizedUploadRow,
  keys: string[]
): unknown => {
  for (const key of keys) {
    if (!(key in row)) {
      continue;
    }

    const value = row[key];
    if (value != null && toString(value)) {
      return value;
    }
  }

  return undefined;
};

const normalizeUrl = (value: unknown): string => {
  const text = toString(value);

  if (!text) {
    return "";
  }

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return "";
  }
};

const skillLevels = new Set<CreateApplicantInput["skills"][number]["level"]>([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

const languageProficiencies = new Set<
  CreateApplicantInput["languages"][number]["proficiency"]
>(["basic", "conversational", "fluent", "native"]);

const parseSkillEntries = (
  value: unknown,
  fallbackYears: number
): CreateApplicantInput["skills"] => {
  const seenNames = new Set<string>();

  return splitEntries(value)
    .map((entry) => {
      const [rawName, rawLevel, rawYears] = entry
        .split("|")
        .map((item) => item.trim());
      const name = rawName ?? "";

      if (!name) {
        return null;
      }

      const normalizedName = name.toLowerCase();
      if (seenNames.has(normalizedName)) {
        return null;
      }

      seenNames.add(normalizedName);

      const levelCandidate = (rawLevel ?? "").toLowerCase() as CreateApplicantInput["skills"][number]["level"];
      const yearsOfExperience = rawYears
        ? toNumber(rawYears)
        : fallbackYears;

      return {
        name,
        level: skillLevels.has(levelCandidate) ? levelCandidate : "intermediate",
        yearsOfExperience,
      };
    })
    .filter(
      (
        skill
      ): skill is CreateApplicantInput["skills"][number] => Boolean(skill)
    );
};

const parseLanguageEntries = (
  value: unknown
): CreateApplicantInput["languages"] => {
  const seenNames = new Set<string>();

  return splitEntries(value)
    .map((entry) => {
      const [rawName, rawProficiency] = entry
        .split("|")
        .map((item) => item.trim());
      const name = rawName ?? "";

      if (!name) {
        return null;
      }

      const normalizedName = name.toLowerCase();
      if (seenNames.has(normalizedName)) {
        return null;
      }

      seenNames.add(normalizedName);

      const proficiencyCandidate = (
        rawProficiency ?? ""
      ).toLowerCase() as CreateApplicantInput["languages"][number]["proficiency"];

      return {
        name,
        proficiency: languageProficiencies.has(proficiencyCandidate)
          ? proficiencyCandidate
          : "conversational",
      };
    })
    .filter(
      (
        language
      ): language is CreateApplicantInput["languages"][number] => Boolean(language)
    );
};

const buildFallbackProfileSummary = (
  applicant: CreateApplicantInput
): string => {
  const detailParts = [
    applicant.headline
      ? `${applicant.fullName} is applying as ${applicant.headline}.`
      : `${applicant.fullName} was imported from an external applicant file.`,
    applicant.skills.length > 0
      ? `Key skills include ${applicant.skills
          .slice(0, 3)
          .map((skill) => skill.name)
          .join(", ")}.`
      : "",
    applicant.experience[0]?.description ?? "",
    applicant.resumeText
      ? applicant.resumeText.replace(/\s+/g, " ").trim().slice(0, 220)
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (detailParts.length >= 20) {
    return detailParts.slice(0, 500);
  }

  return "Imported applicant profile from an external file. Recruiter review is recommended before AI screening.";
};

const titleCaseFilename = (filename: string): string =>
  filename
    .replace(/[-_]+/g, " ")
    .replace(/\.[^.]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const readPdfText = async (buffer: Buffer): Promise<string> => {
  try {
    const parsedPdf = await pdfParse(buffer);
    return parsedPdf.text.replace(/\u0000/g, " ").trim();
  } catch {
    return "";
  }
};

const normalizeResumeText = (value: string): string =>
  value
    .replace(/\u0000/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const buildFallbackPdfApplicant = (
  fileName: string,
  derivedName: string,
  resumeText: string
): CreateApplicantInput | null =>
  normalizeApplicant({
    fullName: derivedName,
    headline: "",
    email: "",
    phone: "",
    location: "Unknown",
    source: "pdf",
    resumeUrl: "",
    resumeFileName: fileName,
    resumeText,
    profileSummary: resumeText.replace(/\s+/g, " ").trim().slice(0, 500),
    totalExperienceYears: 0,
    education: [],
    skills: [],
    languages: [],
    experience: [],
    certifications: [],
    projects: [],
    availability: {
      status: "open-to-opportunities",
      type: "full-time",
      startDate: "",
    },
    socialLinks: {},
    tags: ["pdf-upload"],
  });

const rowToApplicant = (row: Record<string, unknown>): CreateApplicantInput => {
  const normalizedRow = normalizeUploadRow(row);
  const educationValues = splitList(
    getRowValue(normalizedRow, ["education", "degree", "study"])
  );
  const company = toString(getRowValue(normalizedRow, ["company", "employer"]));
  const role = toString(
    getRowValue(normalizedRow, ["role", "title", "position"])
  );
  const experienceDescription = toString(
    getRowValue(normalizedRow, [
      "description",
      "responsibilities",
      "highlights",
    ])
  );
  const experienceTechnologies = splitList(
    getRowValue(normalizedRow, ["technologies", "techstack", "tools"])
  );

  const skillYears = toNumber(
    getRowValue(normalizedRow, [
      "skillyears",
      "experienceyears",
      "yearsexperience",
    ])
  );

  const fullName = toString(
    getRowValue(normalizedRow, ["fullname", "name", "candidate", "applicant"])
  );
  const headline = toString(
    getRowValue(normalizedRow, ["headline", "title", "role"])
  );
  const resumeText = toString(
    getRowValue(normalizedRow, ["resumetext", "notes"])
  );
  const skills = parseSkillEntries(
    getRowValue(normalizedRow, [
      "skills",
      "skillset",
      "technologies",
      "competencies",
      "stack",
    ]),
    skillYears
  );
  const languages = parseLanguageEntries(
    getRowValue(normalizedRow, ["languages", "spokenlanguages"])
  );

  const socialLinks = Object.fromEntries(
    [
      ["linkedin", normalizeUrl(getRowValue(normalizedRow, ["linkedin"]))],
      ["github", normalizeUrl(getRowValue(normalizedRow, ["github"]))],
      ["portfolio", normalizeUrl(getRowValue(normalizedRow, ["portfolio"]))],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  const applicant: CreateApplicantInput = {
    fullName,
    headline,
    email: toString(getRowValue(normalizedRow, ["email"])),
    phone: toString(getRowValue(normalizedRow, ["phone", "contact"])),
    location:
      toString(
        getRowValue(normalizedRow, ["location", "city", "country"])
      ) || "Unknown",
    source: "csv",
    resumeUrl: normalizeUrl(
      getRowValue(normalizedRow, ["resumeurl", "resume", "profileurl"])
    ),
    resumeText,
    profileSummary: toString(
      getRowValue(normalizedRow, [
        "profilesummary",
        "summary",
        "bio",
        "about",
        "headline",
      ])
    ),
    totalExperienceYears: toNumber(
      getRowValue(normalizedRow, [
        "totalexperienceyears",
        "experienceyears",
        "yearsexperience",
      ])
    ),
    education:
      toString(getRowValue(normalizedRow, ["institution", "school"])) ||
      educationValues.length > 0
        ? [
            {
              institution:
                toString(
                  getRowValue(normalizedRow, ["institution", "school"])
                ) || "Not Provided",
              degree:
                toString(getRowValue(normalizedRow, ["degree"])) ||
                educationValues[0] ||
                "Not Provided",
              fieldOfStudy: toString(
                getRowValue(normalizedRow, ["fieldofstudy", "study"])
              ),
              startYear: toOptionalYear(
                getRowValue(normalizedRow, ["startyear"])
              ),
              endYear: toOptionalYear(
                getRowValue(normalizedRow, ["endyear", "yearcompleted"])
              ),
            },
          ]
        : [],
    skills,
    languages,
    experience:
      company || role || experienceDescription
        ? [
            {
              company: company || "Not Provided",
              role: role || "Not Provided",
              startDate:
                toString(
                  getRowValue(normalizedRow, ["startdate", "from"])
                ) || "Unknown",
              endDate: toString(getRowValue(normalizedRow, ["enddate", "to"])),
              description: experienceDescription || "Imported from spreadsheet row.",
              technologies: experienceTechnologies,
              isCurrent:
                toString(getRowValue(normalizedRow, ["iscurrent"])).toLowerCase() ===
                "true",
            },
          ]
        : [],
    certifications: [],
    projects: [],
    availability: {
      status: "open-to-opportunities",
      type: "full-time",
      startDate: "",
    },
    socialLinks,
    tags: splitList(getRowValue(normalizedRow, ["tags", "labels"])),
  };

  if (!applicant.profileSummary) {
    applicant.profileSummary = buildFallbackProfileSummary(applicant);
  }

  if (!applicant.education[0]?.fieldOfStudy) {
    applicant.education = applicant.education.map((item) => ({
      ...item,
      fieldOfStudy: item.fieldOfStudy || educationValues[0] || "Not Provided",
    }));
  }

  return applicant;
};

const normalizeApplicant = (
  applicant: CreateApplicantInput
): CreateApplicantInput | null => {
  if (!applicant.fullName || !applicant.profileSummary) {
    return null;
  }

  return {
    ...applicant,
    location: applicant.location || "Unknown",
    email: applicant.email || "",
    phone: applicant.phone || "",
    resumeUrl: applicant.resumeUrl || "",
    resumeFileName: applicant.resumeFileName || "",
    resumeText: applicant.resumeText || "",
    totalExperienceYears: applicant.totalExperienceYears || 0,
    education: applicant.education ?? [],
    skills: applicant.skills ?? [],
    languages: applicant.languages ?? [],
    experience: applicant.experience ?? [],
    certifications: applicant.certifications ?? [],
    projects: applicant.projects ?? [],
    availability: applicant.availability ?? {
      status: "open-to-opportunities",
      type: "full-time",
      startDate: "",
    },
    socialLinks: applicant.socialLinks ?? {},
    tags: applicant.tags ?? [],
  };
};

const parseSpreadsheetBuffer = async (
  buffer: Buffer
): Promise<Record<string, unknown>[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
  );

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headerValues = Array.isArray(headerRow.values) ? headerRow.values : [];
  const headers = headerValues
    .slice(1)
    .map((value: ExcelJS.CellValue) => toString(value))
    .filter(Boolean);

  const rows: Record<string, unknown>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const rowData: Record<string, unknown> = {};

    headers.forEach((header: string, index: number) => {
      rowData[header] = row.getCell(index + 1).text ?? "";
    });

    if (Object.values(rowData).some((value) => toString(value))) {
      rows.push(rowData);
    }
  });

  return rows;
};

export const parseApplicantUploads = async (
  files: Express.Multer.File[]
): Promise<UploadOutcome> => {
  const applicants: CreateApplicantInput[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".csv") {
      const rows = parseCsv(file.buffer, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, unknown>[];

      rows.forEach((row, index) => {
        const candidate = normalizeApplicant({
          ...rowToApplicant(row),
          source: "csv",
        });

        if (candidate) {
          applicants.push(candidate);
        } else {
          warnings.push(
            `${file.originalname}: skipped CSV row ${index + 1} because name or summary was missing.`
          );
        }
      });

      continue;
    }

    if (extension === ".xlsx" || extension === ".xls") {
      const rows = await parseSpreadsheetBuffer(file.buffer);

      rows.forEach((row, index) => {
        const candidate = normalizeApplicant({
          ...rowToApplicant(row),
          source: "excel",
        });

        if (candidate) {
          applicants.push(candidate);
        } else {
          warnings.push(
            `${file.originalname}: skipped spreadsheet row ${index + 1} because name or summary was missing.`
          );
        }
      });

      continue;
    }

    if (extension === ".pdf") {
      const rawResumeText = await readPdfText(file.buffer);
      const derivedName = titleCaseFilename(file.originalname);
      let candidate: CreateApplicantInput | null = null;

      if (isGeminiConfigured()) {
        try {
          candidate = normalizeApplicant({
            ...(await extractApplicantFromResumePdf(
              file,
              rawResumeText,
              derivedName
            )),
            source: "pdf",
            resumeFileName: file.originalname,
          });
        } catch (error) {
          console.warn(
            `Gemini resume extraction failed for ${file.originalname}. Falling back to raw PDF parsing.`,
            error
          );
          warnings.push(
            `${file.originalname}: Gemini extraction failed, so the system used basic PDF text parsing instead.`
          );
        }
      }

      candidate ??= buildFallbackPdfApplicant(
        file.originalname,
        derivedName,
        rawResumeText
      );

      if (candidate) {
        applicants.push(candidate);
      } else {
        warnings.push(
          `${file.originalname}: skipped PDF because the extracted text was empty.`
        );
      }

      continue;
    }

    warnings.push(`${file.originalname}: unsupported file type.`);
  }

  return { applicants, warnings };
};

export const parseTalentResumeUpload = async (
  file: Express.Multer.File
): Promise<TalentResumeUploadResult> => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".pdf") {
    throw new Error("Talent CV upload currently supports PDF files only.");
  }

  const rawResumeText = await readPdfText(file.buffer);
  let normalizedText = normalizeResumeText(rawResumeText);

  if (isGeminiConfigured()) {
    try {
      normalizedText = normalizeResumeText(
        await extractResumeTextFromPdf(file, normalizedText)
      );
    } catch (error) {
      console.warn(
        `Gemini resume text extraction failed for ${file.originalname}. Falling back to raw PDF parsing.`,
        error
      );
    }
  }

  if (!normalizedText) {
    throw new Error("The uploaded PDF did not contain readable text.");
  }

  return {
    fileName: file.originalname,
    resumeText: normalizedText,
    summaryExcerpt: normalizedText.replace(/\s+/g, " ").trim().slice(0, 420),
  };
};
