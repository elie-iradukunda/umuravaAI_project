import type {
  ApplicantRecord,
  JobRecord,
  ScreeningResultRecord,
} from "./contracts.js";

const now = "2026-04-09T09:00:00.000Z";

export const demoJob: JobRecord = {
  id: "job_demo_frontend_engineer",
  title: "Frontend Engineer",
  department: "Product Engineering",
  location: "Kigali, Rwanda",
  employmentType: "full-time",
  summary:
    "Build and improve recruiter-facing HR workflows using modern React, TypeScript, strong UX thinking, and product-oriented collaboration.",
  idealCandidate:
    "A product-minded frontend engineer with strong React, Next.js, Tailwind CSS, and API integration experience who can translate complex flows into simple interfaces.",
  minimumExperienceYears: 3,
  shortlistLimit: 10,
  requiredSkills: [
    { name: "React", requiredLevel: "advanced", required: true, weight: 0.25 },
    { name: "Next.js", requiredLevel: "advanced", required: true, weight: 0.2 },
    {
      name: "TypeScript",
      requiredLevel: "advanced",
      required: true,
      weight: 0.2,
    },
    {
      name: "Tailwind CSS",
      requiredLevel: "intermediate",
      required: true,
      weight: 0.15,
    },
    {
      name: "API Integration",
      requiredLevel: "intermediate",
      required: true,
      weight: 0.2,
    },
  ],
  educationPreferences: [
    "Computer Science",
    "Software Engineering",
    "Information Systems",
  ],
  createdAt: now,
  updatedAt: now,
};

export const demoApplicants: ApplicantRecord[] = [
  {
    id: "applicant_amina_k",
    jobId: demoJob.id,
    fullName: "Amina Kayitesi",
    headline: "Frontend Engineer",
    email: "amina@example.com",
    phone: "+250700000001",
    location: "Kigali, Rwanda",
    source: "platform",
    resumeUrl: "",
    resumeText: "",
    profileSummary:
      "Frontend engineer with 4 years of experience building SaaS dashboards in React and Next.js, collaborating closely with product and backend teams.",
    totalExperienceYears: 4,
    education: [
      {
        institution: "University of Rwanda",
        degree: "BSc",
        fieldOfStudy: "Computer Science",
        startYear: 2018,
        endYear: 2022,
      },
    ],
    languages: [{ name: "English", proficiency: "fluent" }],
    skills: [
      { name: "React", level: "expert", yearsOfExperience: 4 },
      { name: "Next.js", level: "advanced", yearsOfExperience: 3 },
      { name: "TypeScript", level: "advanced", yearsOfExperience: 4 },
      { name: "Tailwind CSS", level: "advanced", yearsOfExperience: 3 },
      { name: "API Integration", level: "advanced", yearsOfExperience: 4 },
    ],
    experience: [
      {
        company: "TalentSync",
        role: "Frontend Engineer",
        startDate: "2022-01",
        endDate: "2026-03",
        description:
          "Built recruiter dashboards for screening workflows and led the migration from JavaScript to TypeScript.",
        technologies: ["React", "Next.js", "TypeScript"],
        isCurrent: false,
      },
    ],
    certifications: [],
    projects: [
      {
        name: "Talent Dashboard Refresh",
        description: "Rebuilt recruiter workflows for shortlist reviews.",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
        role: "Frontend Engineer",
        link: "",
        startDate: "2025-01",
        endDate: "2025-10",
      },
    ],
    availability: {
      status: "available",
      type: "full-time",
      startDate: "2026-04-15",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/amina-kayitesi",
      github: "https://github.com/amina-k",
    },
    tags: ["ui", "product-minded", "dashboard"],
    screeningStatus: "ready",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "applicant_brian_m",
    jobId: demoJob.id,
    fullName: "Brian Mugisha",
    headline: "Frontend Developer",
    email: "brian@example.com",
    phone: "+250700000002",
    location: "Kampala, Uganda",
    source: "csv",
    resumeUrl: "",
    resumeText: "",
    profileSummary:
      "React developer with strong component design experience and 2 years building responsive web applications for startups.",
    totalExperienceYears: 2,
    education: [
      {
        institution: "Makerere University",
        degree: "BSc",
        fieldOfStudy: "Information Systems",
        startYear: 2019,
        endYear: 2023,
      },
    ],
    languages: [{ name: "English", proficiency: "fluent" }],
    skills: [
      { name: "React", level: "advanced", yearsOfExperience: 2 },
      { name: "Next.js", level: "intermediate", yearsOfExperience: 1 },
      { name: "TypeScript", level: "intermediate", yearsOfExperience: 2 },
      { name: "Tailwind CSS", level: "advanced", yearsOfExperience: 2 },
    ],
    experience: [
      {
        company: "LaunchGrid",
        role: "Frontend Developer",
        startDate: "2024-02",
        endDate: "",
        description:
          "Created design system components and integrated forms with REST APIs.",
        technologies: ["React", "TypeScript", "Tailwind CSS"],
        isCurrent: true,
      },
    ],
    certifications: [],
    projects: [],
    availability: {
      status: "open-to-opportunities",
      type: "full-time",
      startDate: "",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/brian-mugisha",
    },
    tags: ["responsive-ui", "startup"],
    screeningStatus: "ready",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "applicant_chantal_n",
    jobId: demoJob.id,
    fullName: "Chantal Nshimiyimana",
    headline: "Product Engineer",
    email: "chantal@example.com",
    phone: "+250700000003",
    location: "Remote",
    source: "manual",
    resumeUrl: "",
    resumeText: "",
    profileSummary:
      "Product engineer with 5 years across full-stack teams, strong recruiter workflow intuition, and a track record building internal HR tooling.",
    totalExperienceYears: 5,
    education: [
      {
        institution: "African Leadership University",
        degree: "BSc",
        fieldOfStudy: "Software Engineering",
        startYear: 2017,
        endYear: 2021,
      },
    ],
    languages: [
      { name: "English", proficiency: "fluent" },
      { name: "French", proficiency: "conversational" },
    ],
    skills: [
      { name: "React", level: "advanced", yearsOfExperience: 5 },
      { name: "Next.js", level: "advanced", yearsOfExperience: 4 },
      { name: "TypeScript", level: "expert", yearsOfExperience: 5 },
      { name: "Tailwind CSS", level: "intermediate", yearsOfExperience: 2 },
      { name: "API Integration", level: "advanced", yearsOfExperience: 4 },
      { name: "Node.js", level: "advanced", yearsOfExperience: 4 },
    ],
    experience: [
      {
        company: "PeopleFlow",
        role: "Product Engineer",
        startDate: "2021-01",
        endDate: "",
        description:
          "Built candidate review workflows for recruiters and worked with hiring teams to improve transparency.",
        technologies: ["React", "Node.js", "TypeScript"],
        isCurrent: true,
      },
    ],
    certifications: [
      {
        name: "AWS Certified Developer",
        issuer: "Amazon",
        issueDate: "2024-06",
      },
    ],
    projects: [
      {
        name: "PeopleFlow Recruiter Console",
        description: "Built internal HR tooling for shortlist transparency.",
        technologies: ["React", "Node.js", "MongoDB"],
        role: "Product Engineer",
        link: "",
        startDate: "2023-01",
        endDate: "2024-04",
      },
    ],
    availability: {
      status: "available",
      type: "contract",
      startDate: "2026-04-20",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/chantal-n",
      github: "https://github.com/chantal-n",
      portfolio: "https://chantal-portfolio.dev",
    },
    tags: ["hr-tech", "full-stack", "product"],
    screeningStatus: "ready",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "applicant_david_s",
    jobId: demoJob.id,
    fullName: "David Ssentongo",
    headline: "Software Engineer",
    email: "david@example.com",
    phone: "+250700000004",
    location: "Nairobi, Kenya",
    source: "pdf",
    resumeUrl: "",
    resumeText:
      "Mobile-heavy engineer with some React exposure, strong JavaScript fundamentals, and 6 years of product experience.",
    profileSummary:
      "Experienced software engineer moving from mobile and general frontend work into React-heavy product engineering roles.",
    totalExperienceYears: 6,
    education: [
      {
        institution: "KCA University",
        degree: "BSc",
        fieldOfStudy: "Information Technology",
        startYear: 2014,
        endYear: 2018,
      },
    ],
    languages: [{ name: "English", proficiency: "fluent" }],
    skills: [
      { name: "React", level: "intermediate", yearsOfExperience: 2 },
      { name: "TypeScript", level: "intermediate", yearsOfExperience: 2 },
      { name: "Tailwind CSS", level: "beginner", yearsOfExperience: 1 },
      { name: "API Integration", level: "advanced", yearsOfExperience: 5 },
    ],
    experience: [
      {
        company: "Shift Labs",
        role: "Software Engineer",
        startDate: "2019-03",
        endDate: "",
        description:
          "Built customer-facing mobile and web features and owned integrations with third-party APIs.",
        technologies: ["JavaScript", "React", "REST APIs"],
        isCurrent: true,
      },
    ],
    certifications: [],
    projects: [],
    availability: {
      status: "open-to-opportunities",
      type: "contract",
      startDate: "",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/david-ssentongo",
    },
    tags: ["career-shift", "mobile"],
    screeningStatus: "ready",
    createdAt: now,
    updatedAt: now,
  },
];

export const demoScreenings: ScreeningResultRecord[] = [];
