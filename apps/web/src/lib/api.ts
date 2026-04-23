import type {
  AuthResponse,
  CreateApplicantInput,
  CreateJobInput,
  CreateUserInput,
  DashboardResponse,
  JobDetailResponse,
  JobRecord,
  LoginInput,
  NotificationsResponse,
  PublicJobResponse,
  PublicJobsResponse,
  ScreeningResultRecord,
  TalentApplicationsResponse,
  TalentProfileResponse,
  UpdateJobInput,
} from "@umurava/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const withAuthHeaders = (
  userId: string,
  headers: HeadersInit = {}
): HeadersInit => ({
  ...headers,
  "X-User-Id": userId,
});

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
  getDashboard: async (userId: string): Promise<DashboardResponse> =>
    request<DashboardResponse>("/api/dashboard", {
      headers: withAuthHeaders(userId),
      cache: "no-store",
    }),
  getNotifications: async (userId: string): Promise<NotificationsResponse> =>
    request<NotificationsResponse>("/api/notifications", {
      headers: withAuthHeaders(userId),
      cache: "no-store",
    }),
  markNotificationsRead: async (
    userId: string,
    notificationIds: string[]
  ): Promise<NotificationsResponse> =>
    request<NotificationsResponse>("/api/notifications/read", {
      method: "POST",
      headers: withAuthHeaders(userId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ notificationIds }),
    }),
  getPublicJobs: async (): Promise<PublicJobsResponse> =>
    request<PublicJobsResponse>("/api/public/jobs", {
      cache: "no-store",
    }),
  getPublicJob: async (jobId: string): Promise<PublicJobResponse> =>
    request<PublicJobResponse>(`/api/public/jobs/${jobId}`, {
      cache: "no-store",
    }),
  uploadTalentResume: async (
    userId: string,
    file: File
  ): Promise<{ fileName: string; resumeText: string; summaryExcerpt: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return request<{ fileName: string; resumeText: string; summaryExcerpt: string }>(
      "/api/talent/resume-upload",
      {
        method: "POST",
        headers: withAuthHeaders(userId),
        body: formData,
      }
    );
  },
  getTalentProfile: async (userId: string): Promise<TalentProfileResponse> =>
    request<TalentProfileResponse>("/api/talent/profile", {
      headers: withAuthHeaders(userId),
      cache: "no-store",
    }),
  saveTalentProfile: async (
    userId: string,
    input: CreateApplicantInput
  ): Promise<TalentProfileResponse> =>
    request<TalentProfileResponse>("/api/talent/profile", {
      method: "PUT",
      headers: withAuthHeaders(userId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(input),
    }),
  getTalentApplications: async (
    userId: string
  ): Promise<TalentApplicationsResponse> =>
    request<TalentApplicationsResponse>("/api/talent-applications", {
      headers: withAuthHeaders(userId),
      cache: "no-store",
    }),
  getJobDetail: async (userId: string, jobId: string): Promise<JobDetailResponse> =>
    request<JobDetailResponse>(`/api/jobs/${jobId}`, {
      headers: withAuthHeaders(userId),
      cache: "no-store",
    }),
  createJob: async (
    userId: string,
    input: CreateJobInput
  ): Promise<{ job: JobRecord }> =>
    request<{ job: JobRecord }>("/api/jobs", {
      method: "POST",
      headers: withAuthHeaders(userId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(input),
    }),
  updateJob: async (
    userId: string,
    jobId: string,
    input: UpdateJobInput
  ): Promise<{ job: JobRecord }> =>
    request<{ job: JobRecord }>(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: withAuthHeaders(userId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(input),
    }),
  addApplicants: async (
    userId: string,
    jobId: string,
    applicants: CreateApplicantInput[]
  ): Promise<{ importedCount: number }> =>
    request<{ importedCount: number }>(`/api/jobs/${jobId}/applicants`, {
      method: "POST",
      headers: withAuthHeaders(userId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(applicants),
    }),
  applyToJob: async (
    userId: string,
    jobId: string,
    applicant: CreateApplicantInput
  ): Promise<{ importedCount: number }> =>
    request<{ importedCount: number }>(`/api/talent/jobs/${jobId}/apply`, {
      method: "POST",
      headers: withAuthHeaders(userId, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(applicant),
    }),
  uploadApplicants: async (
    userId: string,
    jobId: string,
    files: File[]
  ): Promise<{ importedCount: number; warnings?: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return request<{ importedCount: number; warnings?: string[] }>(
      `/api/jobs/${jobId}/applicants/upload`,
      {
        method: "POST",
        headers: withAuthHeaders(userId),
        body: formData,
      }
    );
  },
  runScreening: async (
    userId: string,
    jobId: string
  ): Promise<{ screenings: ScreeningResultRecord[] }> =>
    request<{ screenings: ScreeningResultRecord[] }>(
      `/api/jobs/${jobId}/screenings/run`,
      {
        method: "POST",
        headers: withAuthHeaders(userId),
      }
    ),
};
