import path from "node:path";

import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import pdfParse from "pdf-parse";
import type { CreateApplicantInput } from "@umurava/shared";

type UploadOutcome = {
  applicants: CreateApplicantInput[];
  warnings: string[];
};

export type TalentResumeUploadResult = {
  fileName: string;
  resumeText: string;
  summaryExcerpt: string;
};

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

const splitList = (value: unknown): string[] =>
  toString(value)
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const titleCaseFilename = (filename: string): string =>
  filename
    .replace(/[-_]+/g, " ")
    .replace(/\.[^.]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const rowToApplicant = (row: Record<string, unknown>): CreateApplicantInput => {
  const skillNames = splitList(
    row.skills ??
      row.skillset ??
      row.technologies ??
      row.competencies ??
      row.stack
  );
  const languageNames = splitList(row.languages ?? row.spokenLanguages);
  const educationValues = splitList(row.education ?? row.degree ?? row.study);
  const company = toString(row.company ?? row.employer);
  const role = toString(row.role ?? row.title ?? row.position);
  const experienceDescription = toString(
    row.description ?? row.responsibilities ?? row.highlights
  );
  const experienceTechnologies = splitList(
    row.technologies ?? row.techStack ?? row.tools
  );

  const skillYears = toNumber(
    row.skillYears ?? row.experienceYears ?? row.yearsExperience
  );

  const socialLinks = Object.fromEntries(
    [
      ["linkedin", toString(row.linkedin)],
      ["github", toString(row.github)],
      ["portfolio", toString(row.portfolio)],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  return {
    fullName: toString(row.fullName ?? row.name ?? row.candidate ?? row.applicant),
    headline: toString(row.headline ?? row.title ?? row.role),
    email: toString(row.email),
    phone: toString(row.phone ?? row.contact),
    location: toString(row.location ?? row.city ?? row.country ?? "Unknown"),
    source: "csv",
    resumeUrl: toString(row.resumeUrl ?? row.resume ?? row.profileUrl),
    resumeText: toString(row.resumeText ?? row.notes),
    profileSummary: toString(
      row.profileSummary ?? row.summary ?? row.bio ?? row.about ?? row.headline
    ),
    totalExperienceYears: toNumber(
      row.totalExperienceYears ?? row.experienceYears ?? row.yearsExperience
    ),
    education:
      toString(row.institution ?? row.school) || educationValues.length > 0
        ? [
            {
              institution: toString(row.institution ?? row.school ?? "Not Provided"),
              degree: toString(row.degree ?? educationValues[0] ?? "Not Provided"),
              fieldOfStudy: toString(
                row.fieldOfStudy ?? row.study ?? educationValues[0] ?? "Not Provided"
              ),
              startYear: toNumber(toString(row.startYear)) ?? undefined,
              endYear: toNumber(
                toString(row.endYear ?? row.yearCompleted)
              ) ?? undefined,
            },
          ]
        : [],
    skills: skillNames.map((name) => ({
      name,
      level: "intermediate",
      yearsOfExperience: skillYears,
    })),
    languages: languageNames.map((name) => ({
      name,
      proficiency: "conversational",
    })),
    experience:
      company || role || experienceDescription
        ? [
            {
              company: company || "Not Provided",
              role: role || "Not Provided",
              startDate: toString(row.startDate ?? row.from ?? ""),
              endDate: toString(row.endDate ?? row.to ?? ""),
              description: experienceDescription || "Imported from spreadsheet row.",
              technologies: experienceTechnologies,
              isCurrent: toString(row.isCurrent).toLowerCase() === "true",
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
    tags: splitList(row.tags ?? row.labels),
  };
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
      const parsedPdf = await pdfParse(file.buffer);
      const derivedName = titleCaseFilename(file.originalname);

      const candidate = normalizeApplicant({
        fullName: derivedName,
        headline: "",
        email: "",
        phone: "",
        location: "Unknown",
        source: "pdf",
        resumeUrl: "",
        resumeFileName: file.originalname,
        resumeText: parsedPdf.text.trim(),
        profileSummary: parsedPdf.text
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500),
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

  const parsedPdf = await pdfParse(file.buffer);
  const normalizedText = parsedPdf.text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    throw new Error("The uploaded PDF did not contain readable text.");
  }

  return {
    fileName: file.originalname,
    resumeText: normalizedText,
    summaryExcerpt: normalizedText.slice(0, 420),
  };
};
