import {
  createApplicantInputSchema,
  createJobInputSchema,
  type CreateApplicantInput,
  type CreateJobInput,
  type UserRole,
} from "@umurava/shared";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { hashPassword } from "../lib/password.js";
import { ApplicantModel } from "../models/applicant.model.js";
import { JobModel } from "../models/job.model.js";
import { ScreeningModel } from "../models/screening.model.js";
import { UserModel } from "../models/user.model.js";
import { MongoRepository } from "../repositories/mongo-repository.js";
import {
  withApplicantRecord,
  withJobRecord,
  withUserRecord,
} from "../repositories/utils.js";
import { isGeminiConfigured } from "../services/gemini.service.js";
import { runScreeningForJob } from "../services/screening.service.js";

type SeedUser = {
  id: string;
  roleId: UserRole;
  name: string;
  email: string;
  password: string;
  location: string;
  talentProfile?: CreateApplicantInput;
};

type SeedJob = {
  id: string;
  input: CreateJobInput;
};

const skill = (
  name: string,
  level: CreateApplicantInput["skills"][number]["level"],
  yearsOfExperience: number
) => ({
  name,
  level,
  yearsOfExperience,
});

const language = (
  name: string,
  proficiency: CreateApplicantInput["languages"][number]["proficiency"]
) => ({
  name,
  proficiency,
});

const experience = (input: CreateApplicantInput["experience"][number]) => input;
const education = (input: CreateApplicantInput["education"][number]) => input;
const certification = (input: CreateApplicantInput["certifications"][number]) => input;
const project = (input: CreateApplicantInput["projects"][number]) => input;

const availability = (
  status: CreateApplicantInput["availability"]["status"],
  type: CreateApplicantInput["availability"]["type"],
  startDate: string
) => ({
  status,
  type,
  startDate,
});

const jobSkill = (
  name: string,
  requiredLevel: CreateJobInput["requiredSkills"][number]["requiredLevel"]
) => ({
  name,
  requiredLevel,
  required: true,
});

const validateProfile = (input: CreateApplicantInput) =>
  createApplicantInputSchema.parse(input);

const validateJob = (input: CreateJobInput) => createJobInputSchema.parse(input);

const seedUsers: SeedUser[] = [
  {
    id: "seed_user_admin_platform",
    roleId: "admin",
    name: "Sonia Aline",
    email: "admin.testing@umurava.ai",
    password: "AdminTest123!",
    location: "Kigali, Rwanda",
  },
  {
    id: "seed_user_job_owner_primary",
    roleId: "job-owner",
    name: "Nadia Uwase",
    email: "owner.testing@umurava.ai",
    password: "OwnerTest123!",
    location: "Kigali, Rwanda",
  },
  {
    id: "seed_user_talent_frontend",
    roleId: "talent",
    name: "Amina Mukamana",
    email: "amina.frontend@umurava.ai",
    password: "TalentTest123!",
    location: "Kigali, Rwanda",
    talentProfile: validateProfile({
      fullName: "Amina Mukamana",
      headline: "Frontend Engineer",
      email: "amina.frontend@umurava.ai",
      phone: "+250788110001",
      location: "Kigali, Rwanda",
      source: "platform",
      resumeUrl: "https://portfolio.aina.dev/resume",
      resumeFileName: "amina-mukamana-frontend.pdf",
      resumeText: [
        "Frontend engineer with 4 years building React and Next.js products.",
        "Strong experience in TypeScript, Tailwind CSS, design systems, performance tuning, and API integration.",
        "Delivered customer-facing dashboards, onboarding flows, analytics views, and reusable component libraries.",
      ].join("\n"),
      profileSummary:
        "Frontend engineer focused on high-quality React interfaces, design systems, and product delivery for fast-moving teams.",
      totalExperienceYears: 4,
      education: [
        education({
          institution: "University of Rwanda",
          degree: "Bachelor of Science",
          fieldOfStudy: "Software Engineering",
          startYear: 2017,
          endYear: 2021,
        }),
      ],
      skills: [
        skill("React", "expert", 4),
        skill("Next.js", "advanced", 3),
        skill("TypeScript", "expert", 4),
        skill("Tailwind CSS", "advanced", 3),
        skill("UI Testing", "intermediate", 2),
        skill("Design Systems", "advanced", 3),
      ],
      languages: [
        language("English", "fluent"),
        language("Kinyarwanda", "native"),
      ],
      experience: [
        experience({
          company: "Pixel Foundry",
          role: "Frontend Engineer",
          startDate: "2023-01",
          endDate: "",
          description:
            "Built React and Next.js product dashboards, component libraries, and analytics pages with strong accessibility and performance standards.",
          technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
          isCurrent: true,
        }),
        experience({
          company: "Cloud Leap",
          role: "Junior Frontend Developer",
          startDate: "2021-06",
          endDate: "2022-12",
          description:
            "Implemented responsive UI flows, form validation, and API-connected account experiences for SaaS products.",
          technologies: ["React", "JavaScript", "CSS", "REST APIs"],
          isCurrent: false,
        }),
      ],
      certifications: [
        certification({
          name: "Meta Front-End Developer",
          issuer: "Coursera",
          issueDate: "2023-04",
        }),
      ],
      projects: [
        project({
          name: "Insights Dashboard",
          description:
            "Created a reusable admin analytics workspace with data visualization, filter states, and export flows.",
          technologies: ["Next.js", "React", "TypeScript", "Recharts"],
          role: "Frontend Lead",
          link: "https://portfolio.aina.dev/projects/insights-dashboard",
          startDate: "2024-02",
          endDate: "2024-08",
        }),
      ],
      availability: availability("available", "full-time", "2026-05-01"),
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/amina-mukamana",
        github: "https://github.com/amina-mukamana",
        portfolio: "https://portfolio.aina.dev",
      },
      tags: ["frontend", "react", "typescript", "design-system"],
    }),
  },
  {
    id: "seed_user_talent_backend",
    roleId: "talent",
    name: "Brian Ndayisaba",
    email: "brian.backend@umurava.ai",
    password: "TalentTest123!",
    location: "Kigali, Rwanda",
    talentProfile: validateProfile({
      fullName: "Brian Ndayisaba",
      headline: "Backend Engineer",
      email: "brian.backend@umurava.ai",
      phone: "+250788110002",
      location: "Kigali, Rwanda",
      source: "platform",
      resumeUrl: "https://backend.brian.dev/resume",
      resumeFileName: "brian-ndayisaba-backend.pdf",
      resumeText: [
        "Backend engineer with 5 years building APIs, background workers, and data services.",
        "Experienced in Node.js, PostgreSQL, distributed systems, authentication, and cloud infrastructure.",
        "Shipped secure hiring, payments, and analytics backends with strong observability and reliability.",
      ].join("\n"),
      profileSummary:
        "Backend engineer specializing in Node.js services, PostgreSQL data design, and reliable API platforms.",
      totalExperienceYears: 5,
      education: [
        education({
          institution: "African Leadership University",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          startYear: 2016,
          endYear: 2020,
        }),
      ],
      skills: [
        skill("Node.js", "expert", 5),
        skill("TypeScript", "advanced", 4),
        skill("PostgreSQL", "advanced", 5),
        skill("REST APIs", "expert", 5),
        skill("MongoDB", "intermediate", 2),
        skill("Docker", "advanced", 3),
      ],
      languages: [
        language("English", "fluent"),
        language("French", "conversational"),
        language("Kinyarwanda", "native"),
      ],
      experience: [
        experience({
          company: "Ledger Stack",
          role: "Backend Engineer",
          startDate: "2022-03",
          endDate: "",
          description:
            "Designed scalable Node.js APIs, database schemas, queue workers, and auth services for multi-tenant products.",
          technologies: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker"],
          isCurrent: true,
        }),
        experience({
          company: "Rwanda Labs",
          role: "Software Engineer",
          startDate: "2020-07",
          endDate: "2022-02",
          description:
            "Built API services, admin tooling, and internal developer tooling for logistics and operations teams.",
          technologies: ["Node.js", "Express", "MongoDB", "AWS"],
          isCurrent: false,
        }),
      ],
      certifications: [
        certification({
          name: "AWS Certified Developer",
          issuer: "Amazon",
          issueDate: "2024-05",
        }),
      ],
      projects: [
        project({
          name: "Workflow Automation API",
          description:
            "Built a rules-driven workflow service with audit trails, retry queues, and SLA monitoring.",
          technologies: ["Node.js", "PostgreSQL", "Redis", "BullMQ"],
          role: "Backend Architect",
          link: "https://backend.brian.dev/projects/workflow-api",
          startDate: "2024-01",
          endDate: "2024-09",
        }),
      ],
      availability: availability("available", "full-time", "2026-05-15"),
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/brian-ndayisaba",
        github: "https://github.com/brian-ndayisaba",
        portfolio: "https://backend.brian.dev",
      },
      tags: ["backend", "nodejs", "postgresql", "apis"],
    }),
  },
  {
    id: "seed_user_talent_data",
    roleId: "talent",
    name: "Claire Mutesi",
    email: "claire.data@umurava.ai",
    password: "TalentTest123!",
    location: "Kigali, Rwanda",
    talentProfile: validateProfile({
      fullName: "Claire Mutesi",
      headline: "Data Analyst",
      email: "claire.data@umurava.ai",
      phone: "+250788110003",
      location: "Kigali, Rwanda",
      source: "platform",
      resumeUrl: "https://clairedata.dev/resume",
      resumeFileName: "claire-mutesi-data.pdf",
      resumeText: [
        "Data analyst with 4 years building reports, dashboards, and business intelligence workflows.",
        "Skilled in SQL, Power BI, Excel, stakeholder communication, experimentation, and KPI tracking.",
        "Delivered insight packs for growth, operations, customer success, and platform teams.",
      ].join("\n"),
      profileSummary:
        "Data analyst focused on turning messy operational data into decision-ready reporting, dashboards, and insights.",
      totalExperienceYears: 4,
      education: [
        education({
          institution: "University of Kigali",
          degree: "Bachelor of Science",
          fieldOfStudy: "Information Systems",
          startYear: 2017,
          endYear: 2021,
        }),
      ],
      skills: [
        skill("SQL", "expert", 4),
        skill("Power BI", "advanced", 3),
        skill("Excel", "expert", 5),
        skill("Data Visualization", "advanced", 4),
        skill("Python", "intermediate", 2),
        skill("Stakeholder Reporting", "advanced", 4),
      ],
      languages: [
        language("English", "fluent"),
        language("Kinyarwanda", "native"),
      ],
      experience: [
        experience({
          company: "Growth Metrics Africa",
          role: "Data Analyst",
          startDate: "2022-02",
          endDate: "",
          description:
            "Built SQL-powered reports, BI dashboards, experiment tracking views, and weekly executive insight summaries.",
          technologies: ["SQL", "Power BI", "Excel", "Python"],
          isCurrent: true,
        }),
        experience({
          company: "Market Insight Hub",
          role: "Junior Analyst",
          startDate: "2021-01",
          endDate: "2022-01",
          description:
            "Maintained recurring business reports, data cleaning workflows, and stakeholder presentations for performance reviews.",
          technologies: ["Excel", "Google Sheets", "SQL"],
          isCurrent: false,
        }),
      ],
      certifications: [
        certification({
          name: "Google Data Analytics",
          issuer: "Google",
          issueDate: "2023-06",
        }),
      ],
      projects: [
        project({
          name: "Revenue Intelligence Dashboard",
          description:
            "Connected CRM and billing data into a reporting layer that surfaced revenue leakage and conversion insights.",
          technologies: ["SQL", "Power BI", "Excel"],
          role: "Lead Analyst",
          link: "https://clairedata.dev/projects/revenue-intelligence",
          startDate: "2024-03",
          endDate: "2024-10",
        }),
      ],
      availability: availability("open-to-opportunities", "full-time", "2026-05-10"),
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/claire-mutesi",
        portfolio: "https://clairedata.dev",
      },
      tags: ["data", "analytics", "sql", "reporting"],
    }),
  },
  {
    id: "seed_user_talent_design",
    roleId: "talent",
    name: "Daniel Iradukunda",
    email: "daniel.design@umurava.ai",
    password: "TalentTest123!",
    location: "Kigali, Rwanda",
    talentProfile: validateProfile({
      fullName: "Daniel Iradukunda",
      headline: "Product Designer",
      email: "daniel.design@umurava.ai",
      phone: "+250788110004",
      location: "Kigali, Rwanda",
      source: "platform",
      resumeUrl: "https://danieldesign.dev/resume",
      resumeFileName: "daniel-iradukunda-design.pdf",
      resumeText: [
        "Product designer with 5 years creating user flows, prototypes, and high-conviction product experiences.",
        "Experienced in Figma, UX research, interaction design, design systems, and cross-functional product delivery.",
        "Worked on mobile onboarding, admin tools, support workflows, and growth-focused product redesigns.",
      ].join("\n"),
      profileSummary:
        "Product designer who combines user research, Figma prototyping, and system thinking to ship usable digital products.",
      totalExperienceYears: 5,
      education: [
        education({
          institution: "University of Rwanda",
          degree: "Bachelor of Arts",
          fieldOfStudy: "Graphic and Communication Design",
          startYear: 2015,
          endYear: 2019,
        }),
      ],
      skills: [
        skill("Figma", "expert", 5),
        skill("UX Research", "advanced", 4),
        skill("Interaction Design", "advanced", 5),
        skill("Design Systems", "advanced", 4),
        skill("Usability Testing", "advanced", 3),
        skill("Product Strategy", "intermediate", 2),
      ],
      languages: [
        language("English", "fluent"),
        language("Kinyarwanda", "native"),
      ],
      experience: [
        experience({
          company: "Loop Studio",
          role: "Product Designer",
          startDate: "2022-01",
          endDate: "",
          description:
            "Led discovery, Figma prototyping, design system maintenance, and experiment design for B2B product teams.",
          technologies: ["Figma", "FigJam", "Maze", "Notion"],
          isCurrent: true,
        }),
        experience({
          company: "Bright Interface",
          role: "UI/UX Designer",
          startDate: "2019-08",
          endDate: "2021-12",
          description:
            "Created web and mobile product flows, conducted interviews, and translated insights into practical UI improvements.",
          technologies: ["Figma", "Adobe XD", "Miro"],
          isCurrent: false,
        }),
      ],
      certifications: [
        certification({
          name: "Google UX Design Certificate",
          issuer: "Google",
          issueDate: "2022-11",
        }),
      ],
      projects: [
        project({
          name: "Support Portal Redesign",
          description:
            "Redesigned a customer support workspace with faster navigation, clearer task grouping, and stronger agent productivity.",
          technologies: ["Figma", "UX Research", "Usability Testing"],
          role: "Lead Product Designer",
          link: "https://danieldesign.dev/projects/support-portal",
          startDate: "2024-01",
          endDate: "2024-07",
        }),
      ],
      availability: availability("available", "contract", "2026-04-28"),
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/daniel-iradukunda",
        portfolio: "https://danieldesign.dev",
      },
      tags: ["design", "ux", "figma", "product"],
    }),
  },
  {
    id: "seed_user_talent_support",
    roleId: "talent",
    name: "Esther Uwera",
    email: "esther.support@umurava.ai",
    password: "TalentTest123!",
    location: "Kigali, Rwanda",
    talentProfile: validateProfile({
      fullName: "Esther Uwera",
      headline: "Customer Support Specialist",
      email: "esther.support@umurava.ai",
      phone: "+250788110005",
      location: "Kigali, Rwanda",
      source: "platform",
      resumeUrl: "https://support.esther.dev/resume",
      resumeFileName: "esther-uwera-support.pdf",
      resumeText: [
        "Customer support specialist with 5 years supporting users across email, chat, and phone.",
        "Strong in CRM tools, escalation handling, documentation, and service quality improvement.",
        "Partnered with product and operations teams to close feedback loops and improve customer satisfaction.",
      ].join("\n"),
      profileSummary:
        "Customer support professional with strong communication, CRM workflow ownership, and issue resolution experience.",
      totalExperienceYears: 5,
      education: [
        education({
          institution: "Mount Kenya University Rwanda",
          degree: "Bachelor of Business Administration",
          fieldOfStudy: "Business Administration",
          startYear: 2016,
          endYear: 2020,
        }),
      ],
      skills: [
        skill("Customer Support", "expert", 5),
        skill("CRM Tools", "advanced", 4),
        skill("Communication", "expert", 5),
        skill("Problem Solving", "advanced", 4),
        skill("Documentation", "advanced", 4),
        skill("Quality Assurance", "intermediate", 2),
      ],
      languages: [
        language("English", "fluent"),
        language("French", "conversational"),
        language("Kinyarwanda", "native"),
      ],
      experience: [
        experience({
          company: "CareFlow",
          role: "Customer Support Specialist",
          startDate: "2022-04",
          endDate: "",
          description:
            "Owned customer conversations, escalations, troubleshooting guidance, and feedback reporting across support channels.",
          technologies: ["Zendesk", "Freshdesk", "Google Workspace"],
          isCurrent: true,
        }),
        experience({
          company: "Service Hub Rwanda",
          role: "Support Associate",
          startDate: "2020-06",
          endDate: "2022-03",
          description:
            "Resolved incoming service requests, managed ticket routing, and contributed to knowledge base updates.",
          technologies: ["Intercom", "Notion", "Slack"],
          isCurrent: false,
        }),
      ],
      certifications: [
        certification({
          name: "Customer Service Foundations",
          issuer: "LinkedIn Learning",
          issueDate: "2024-01",
        }),
      ],
      projects: [
        project({
          name: "Knowledge Base Optimization",
          description:
            "Reorganized support content and issue templates to reduce duplicate tickets and improve first-response quality.",
          technologies: ["Notion", "Zendesk", "Docs"],
          role: "Support Process Contributor",
          link: "https://support.esther.dev/projects/knowledge-base",
          startDate: "2024-02",
          endDate: "2024-06",
        }),
      ],
      availability: availability("available", "full-time", "2026-05-05"),
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/esther-uwera",
        portfolio: "https://support.esther.dev",
      },
      tags: ["support", "crm", "communication", "service"],
    }),
  },
];

const seedJobs: SeedJob[] = [
  {
    id: "seed_job_frontend_engineer",
    input: validateJob({
      title: "Frontend Engineer",
      department: "Product Engineering",
      location: "Kigali, Rwanda",
      employmentType: "full-time",
      summary:
        "We are hiring a Frontend Engineer to build product interfaces, improve dashboard usability, and ship polished user experiences across web applications.",
      idealCandidate:
        "The ideal candidate is strong in React, TypeScript, and component architecture, collaborates well with design and product, and pays attention to performance, accessibility, and implementation quality.",
      minimumExperienceYears: 3,
      shortlistLimit: 5,
      requiredSkills: [
        jobSkill("React", "expert"),
        jobSkill("Next.js", "advanced"),
        jobSkill("TypeScript", "advanced"),
        jobSkill("Tailwind CSS", "intermediate"),
        jobSkill("Design Systems", "intermediate"),
      ],
      educationPreferences: [
        "Software Engineering",
        "Computer Science",
        "Information Systems",
      ],
    }),
  },
  {
    id: "seed_job_backend_engineer",
    input: validateJob({
      title: "Backend Engineer",
      department: "Platform Engineering",
      location: "Kigali, Rwanda",
      employmentType: "full-time",
      summary:
        "We need a Backend Engineer to design APIs, maintain data services, improve system reliability, and support secure product integrations.",
      idealCandidate:
        "The best candidate is strong in Node.js, data modeling, and production-ready APIs, and can balance reliability, observability, and developer-friendly architecture.",
      minimumExperienceYears: 4,
      shortlistLimit: 5,
      requiredSkills: [
        jobSkill("Node.js", "expert"),
        jobSkill("TypeScript", "advanced"),
        jobSkill("PostgreSQL", "advanced"),
        jobSkill("REST APIs", "expert"),
        jobSkill("Docker", "intermediate"),
      ],
      educationPreferences: [
        "Computer Science",
        "Software Engineering",
        "Information Technology",
      ],
    }),
  },
  {
    id: "seed_job_data_analyst",
    input: validateJob({
      title: "Data Analyst",
      department: "Growth & Insights",
      location: "Kigali, Rwanda",
      employmentType: "full-time",
      summary:
        "This role turns operational and customer data into decision-ready dashboards, KPI reporting, and insight packs for leadership and product teams.",
      idealCandidate:
        "We want someone strong in SQL, BI tooling, reporting clarity, and stakeholder communication who can turn ambiguous questions into measurable analysis.",
      minimumExperienceYears: 3,
      shortlistLimit: 5,
      requiredSkills: [
        jobSkill("SQL", "expert"),
        jobSkill("Power BI", "advanced"),
        jobSkill("Excel", "advanced"),
        jobSkill("Data Visualization", "advanced"),
        jobSkill("Stakeholder Reporting", "intermediate"),
      ],
      educationPreferences: [
        "Information Systems",
        "Statistics",
        "Data Science",
        "Business Analytics",
      ],
    }),
  },
  {
    id: "seed_job_product_designer",
    input: validateJob({
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      employmentType: "contract",
      summary:
        "We are looking for a Product Designer to lead user flows, simplify complex workflows, and strengthen design-system consistency across our product surface.",
      idealCandidate:
        "The right candidate combines research, Figma expertise, prototyping, and strong product collaboration to move from user insight to shipped experience.",
      minimumExperienceYears: 4,
      shortlistLimit: 5,
      requiredSkills: [
        jobSkill("Figma", "expert"),
        jobSkill("UX Research", "advanced"),
        jobSkill("Interaction Design", "advanced"),
        jobSkill("Design Systems", "advanced"),
        jobSkill("Usability Testing", "intermediate"),
      ],
      educationPreferences: [
        "Graphic Design",
        "Communication Design",
        "Human Computer Interaction",
      ],
    }),
  },
  {
    id: "seed_job_customer_support_specialist",
    input: validateJob({
      title: "Customer Support Specialist",
      department: "Customer Experience",
      location: "Kigali, Rwanda",
      employmentType: "full-time",
      summary:
        "The Customer Support Specialist will support clients across email, chat, and phone, resolve issues quickly, and improve service quality through strong documentation and follow-up.",
      idealCandidate:
        "This role needs a calm communicator who understands CRM workflows, handles escalations well, and can spot recurring issues that should feed back into operations and product.",
      minimumExperienceYears: 3,
      shortlistLimit: 5,
      requiredSkills: [
        jobSkill("Customer Support", "expert"),
        jobSkill("CRM Tools", "advanced"),
        jobSkill("Communication", "expert"),
        jobSkill("Problem Solving", "advanced"),
        jobSkill("Documentation", "intermediate"),
      ],
      educationPreferences: [
        "Business Administration",
        "Customer Relations",
        "Communication",
        "Business Information Technology",
      ],
    }),
  },
];

const buildApplicationRecords = (
  talentUsers: SeedUser[],
  jobs: SeedJob[]
) =>
  jobs.flatMap((job, jobIndex) =>
    talentUsers.map((user, talentIndex) => {
      if (!user.talentProfile) {
        throw new Error(`Missing talent profile for ${user.email}`);
      }

      const createdAt = new Date(
        Date.UTC(2026, 3, 23, 8 + jobIndex, talentIndex * 7, 0)
      ).toISOString();

      return withApplicantRecord(job.id, user.talentProfile, {
        id: `seed_app_${job.id}_${user.id}`,
        submittedByUserId: user.id,
        createdAt,
        updatedAt: createdAt,
      });
    })
  );

const upsertSeedUsers = async (users: SeedUser[]) => {
  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);
    const baseRecord = withUserRecord(
      {
        name: user.name,
        email: user.email,
        passwordHash: hashedPassword,
        roleId: user.roleId,
        location: user.location,
      },
      { id: user.id }
    );

    await UserModel.findOneAndUpdate(
      { id: user.id },
      {
        ...baseRecord,
        talentProfile: user.talentProfile ?? null,
        talentProfileUpdatedAt: user.talentProfile ? new Date() : null,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }
};

const upsertSeedJobs = async (ownerUserId: string, jobs: SeedJob[]) => {
  for (const job of jobs) {
    const jobRecord = withJobRecord(ownerUserId, job.input, {
      id: job.id,
    });

    await JobModel.findOneAndUpdate(
      { id: job.id },
      jobRecord,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }
};

const replaceSeedApplications = async (
  talentUsers: SeedUser[],
  jobs: SeedJob[]
) => {
  const applicantIds = jobs.flatMap((job) =>
    talentUsers.map((user) => `seed_app_${job.id}_${user.id}`)
  );

  await ScreeningModel.deleteMany({ jobId: { $in: jobs.map((job) => job.id) } });
  await ApplicantModel.deleteMany({ id: { $in: applicantIds } });

  const applications = buildApplicationRecords(talentUsers, jobs);
  await ApplicantModel.insertMany(applications);

  return applications.length;
};

const printCredentials = (users: SeedUser[]) => {
  console.log("");
  console.log("Test credentials");
  console.log("================");

  users.forEach((user) => {
    console.log(
      `${user.roleId.padEnd(9)} ${user.email} / ${user.password}`
    );
  });
};

const delay = async (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const isQuotaError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  Number((error as { status?: number }).status) === 429;

const runScreeningWithRateLimitHandling = async (
  repository: MongoRepository,
  jobId: string
) => {
  let attempt = 0;

  while (true) {
    try {
      return await runScreeningForJob(repository, jobId);
    } catch (error) {
      if (!isQuotaError(error) || attempt >= 3) {
        throw error;
      }

      attempt += 1;
      console.warn(
        `Gemini quota reached while screening ${jobId}. Waiting 65 seconds before retry ${attempt}.`
      );
      await delay(65_000);
    }
  }
};

const seed = async () => {
  if (!env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is required for this seed because the test accounts should persist between restarts."
    );
  }

  const repository = new MongoRepository(env.MONGODB_URI);
  await repository.connect();

  const adminUser = seedUsers.find((user) => user.roleId === "admin");
  const ownerUser = seedUsers.find((user) => user.roleId === "job-owner");
  const talentUsers = seedUsers.filter((user) => user.roleId === "talent");

  if (!adminUser || !ownerUser || talentUsers.length !== 5) {
    throw new Error("Seed user configuration is incomplete.");
  }

  try {
    await upsertSeedUsers(seedUsers);
    await upsertSeedJobs(ownerUser.id, seedJobs);
    const applicationCount = await replaceSeedApplications(talentUsers, seedJobs);

    const screenedJobIds: string[] = [];
    if (isGeminiConfigured()) {
      for (const [index, job] of seedJobs.entries()) {
        await runScreeningWithRateLimitHandling(repository, job.id);
        screenedJobIds.push(job.id);

        if (index < seedJobs.length - 1) {
          console.log(
            `Waiting 65 seconds before screening the next job to stay within Gemini free-tier limits.`
          );
          await delay(65_000);
        }
      }
    }

    console.log("Seed complete.");
    console.log(
      `Created or updated ${seedUsers.length} users, ${seedJobs.length} jobs, and ${applicationCount} applications.`
    );
    console.log(
      isGeminiConfigured()
        ? `Gemini screening completed for ${screenedJobIds.length} jobs.`
        : "Gemini screening was skipped because GEMINI_API_KEY is not configured."
    );
    console.log("");
    console.log("Seeded jobs");
    console.log("===========");
    seedJobs.forEach((job) => {
      console.log(`- ${job.input.title} (${job.id})`);
    });
    printCredentials(seedUsers);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error("Failed to seed test data.", error);
  process.exit(1);
});
