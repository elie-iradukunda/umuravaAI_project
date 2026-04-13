import type {
  AuthResponse,
  CreateApplicantInput,
  CreateJobInput,
  CreateUserInput,
  DashboardResponse,
  JobDetailResponse,
  JobRecord,
  LoginInput,
  ScreeningResultRecord,
  TalentApplicationsResponse,
  UpdateJobInput,
} from "@umurava/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseResponse = async <T>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed.");
  }

  return data;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(buildUrl(path), init);
    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Could not reach the API at ${API_BASE_URL}. Start the backend with "npm run dev" from the project root, or run "npm run dev:api" in a second terminal.`
      );
    }

    throw error;
  }
};

export const api = {
  signup: async (input: CreateUserInput): Promise<AuthResponse> =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  login: async (input: LoginInput): Promise<AuthResponse> =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  getDashboard: async (): Promise<DashboardResponse> =>
    request<DashboardResponse>("/api/dashboard", {
      cache: "no-store",
    }),
  uploadTalentResume: async (
    file: File
  ): Promise<{ fileName: string; resumeText: string; summaryExcerpt: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return request<{ fileName: string; resumeText: string; summaryExcerpt: string }>(
      "/api/talent/resume-upload",
      {
        method: "POST",
        body: formData,
      }
    );
  },
  getTalentApplications: async (
    email: string,
    fullName?: string
  ): Promise<TalentApplicationsResponse> => {
    const params = new URLSearchParams();
    if (email.trim()) {
      params.set("email", email.trim());
    }
    if (fullName?.trim()) {
      params.set("fullName", fullName.trim());
    }

    return request<TalentApplicationsResponse>(
      `/api/talent-applications?${params.toString()}`,
      {
        cache: "no-store",
      }
    );
  },
  getJobDetail: async (jobId: string): Promise<JobDetailResponse> =>
    request<JobDetailResponse>(`/api/jobs/${jobId}`, {
      cache: "no-store",
    }),
  createJob: async (input: CreateJobInput): Promise<{ job: JobRecord }> =>
    request<{ job: JobRecord }>("/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  updateJob: async (
    jobId: string,
    input: UpdateJobInput
  ): Promise<{ job: JobRecord }> =>
    request<{ job: JobRecord }>(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  addApplicants: async (
    jobId: string,
    applicants: CreateApplicantInput[]
  ): Promise<{ importedCount: number }> =>
    request<{ importedCount: number }>(`/api/jobs/${jobId}/applicants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicants),
    }),
  uploadApplicants: async (
    jobId: string,
    files: File[]
  ): Promise<{ importedCount: number; warnings?: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return request<{ importedCount: number; warnings?: string[] }>(
      `/api/jobs/${jobId}/applicants/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
  },
  runScreening: async (
    jobId: string
  ): Promise<{ screenings: ScreeningResultRecord[] }> =>
    request<{ screenings: ScreeningResultRecord[] }>(
      `/api/jobs/${jobId}/screenings/run`,
      {
        method: "POST",
      }
    ),
};
