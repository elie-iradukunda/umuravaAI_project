"use client";

import type {
  CreateApplicantInput,
  CreateJobInput,
  DashboardResponse,
  JobDetailResponse,
  JobRecord,
  UpdateJobInput,
} from "@umurava/shared";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../lib/api";
import { selectCurrentUserId } from "./auth-slice";
import type { RootState } from "./index";
import { loadNotifications } from "./notification-slice";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type RecruiterState = {
  dashboard: DashboardResponse | null;
  jobDetail: JobDetailResponse | null;
  dashboardStatus: AsyncStatus;
  jobDetailStatus: AsyncStatus;
  createJobStatus: AsyncStatus;
  updateJobStatus: AsyncStatus;
  addApplicantStatus: AsyncStatus;
  uploadApplicantStatus: AsyncStatus;
  screeningStatus: AsyncStatus;
  error: string | null;
  uploadWarnings: string[];
};

const initialState: RecruiterState = {
  dashboard: null,
  jobDetail: null,
  dashboardStatus: "idle",
  jobDetailStatus: "idle",
  createJobStatus: "idle",
  updateJobStatus: "idle",
  addApplicantStatus: "idle",
  uploadApplicantStatus: "idle",
  screeningStatus: "idle",
  error: null,
  uploadWarnings: [],
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong.";

const requireCurrentUserId = (state: RootState): string => {
  const userId = selectCurrentUserId(state);

  if (!userId) {
    throw new Error("Please sign in to continue.");
  }

  return userId;
};

export const loadDashboard = createAsyncThunk<
  DashboardResponse,
  void,
  { state: RootState; rejectValue: string }
>("recruiter/loadDashboard", async (_, thunkApi) => {
  try {
    return await api.getDashboard(requireCurrentUserId(thunkApi.getState()));
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const loadJobDetail = createAsyncThunk<
  JobDetailResponse,
  string,
  { state: RootState; rejectValue: string }
>("recruiter/loadJobDetail", async (jobId, thunkApi) => {
  try {
    return await api.getJobDetail(
      requireCurrentUserId(thunkApi.getState()),
      jobId
    );
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const createJob = createAsyncThunk<
  JobRecord,
  CreateJobInput,
  { state: RootState; rejectValue: string }
>("recruiter/createJob", async (input, thunkApi) => {
  try {
    const response = await api.createJob(
      requireCurrentUserId(thunkApi.getState()),
      input
    );
    void thunkApi.dispatch(loadDashboard());
    void thunkApi.dispatch(loadNotifications());
    return response.job;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const updateJob = createAsyncThunk<
  JobRecord,
  { jobId: string; input: UpdateJobInput },
  { state: RootState; rejectValue: string }
>("recruiter/updateJob", async ({ jobId, input }, thunkApi) => {
  try {
    const response = await api.updateJob(
      requireCurrentUserId(thunkApi.getState()),
      jobId,
      input
    );
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    void thunkApi.dispatch(loadNotifications());
    return response.job;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addApplicants = createAsyncThunk<
  number,
  { jobId: string; applicants: CreateApplicantInput[] },
  { state: RootState; rejectValue: string }
>("recruiter/addApplicants", async ({ jobId, applicants }, thunkApi) => {
  try {
    const response = await api.addApplicants(
      requireCurrentUserId(thunkApi.getState()),
      jobId,
      applicants
    );
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    void thunkApi.dispatch(loadNotifications());
    return response.importedCount;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const uploadApplicants = createAsyncThunk<
  string[],
  { jobId: string; files: File[] },
  { state: RootState; rejectValue: string }
>("recruiter/uploadApplicants", async ({ jobId, files }, thunkApi) => {
  try {
    const response = await api.uploadApplicants(
      requireCurrentUserId(thunkApi.getState()),
      jobId,
      files
    );
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    void thunkApi.dispatch(loadNotifications());
    return response.warnings ?? [];
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const runScreening = createAsyncThunk<
  number,
  string,
  { state: RootState; rejectValue: string }
>("recruiter/runScreening", async (jobId, thunkApi) => {
  try {
    const response = await api.runScreening(
      requireCurrentUserId(thunkApi.getState()),
      jobId
    );
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    void thunkApi.dispatch(loadNotifications());
    return response.screenings.length;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

const recruiterSlice = createSlice({
  name: "recruiter",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearUploadWarnings(state) {
      state.uploadWarnings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboard.pending, (state) => {
        state.dashboardStatus = "loading";
        state.error = null;
      })
      .addCase(loadDashboard.fulfilled, (state, action) => {
        state.dashboardStatus = "succeeded";
        state.dashboard = action.payload;
      })
      .addCase(loadDashboard.rejected, (state, action) => {
        state.dashboardStatus = "failed";
        state.error = action.payload ?? "Failed to load dashboard.";
      })
      .addCase(loadJobDetail.pending, (state) => {
        state.jobDetailStatus = "loading";
        state.error = null;
      })
      .addCase(loadJobDetail.fulfilled, (state, action) => {
        state.jobDetailStatus = "succeeded";
        state.jobDetail = action.payload;
      })
      .addCase(loadJobDetail.rejected, (state, action) => {
        state.jobDetailStatus = "failed";
        state.error = action.payload ?? "Failed to load job details.";
      })
      .addCase(createJob.pending, (state) => {
        state.createJobStatus = "loading";
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state) => {
        state.createJobStatus = "succeeded";
      })
      .addCase(createJob.rejected, (state, action) => {
        state.createJobStatus = "failed";
        state.error = action.payload ?? "Failed to create job.";
      })
      .addCase(updateJob.pending, (state) => {
        state.updateJobStatus = "loading";
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state) => {
        state.updateJobStatus = "succeeded";
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.updateJobStatus = "failed";
        state.error = action.payload ?? "Failed to update job.";
      })
      .addCase(addApplicants.pending, (state) => {
        state.addApplicantStatus = "loading";
        state.error = null;
      })
      .addCase(addApplicants.fulfilled, (state) => {
        state.addApplicantStatus = "succeeded";
      })
      .addCase(addApplicants.rejected, (state, action) => {
        state.addApplicantStatus = "failed";
        state.error = action.payload ?? "Failed to add applicants.";
      })
      .addCase(uploadApplicants.pending, (state) => {
        state.uploadApplicantStatus = "loading";
        state.error = null;
        state.uploadWarnings = [];
      })
      .addCase(uploadApplicants.fulfilled, (state, action) => {
        state.uploadApplicantStatus = "succeeded";
        state.uploadWarnings = action.payload;
      })
      .addCase(uploadApplicants.rejected, (state, action) => {
        state.uploadApplicantStatus = "failed";
        state.error = action.payload ?? "Failed to upload applicants.";
      })
      .addCase(runScreening.pending, (state) => {
        state.screeningStatus = "loading";
        state.error = null;
      })
      .addCase(runScreening.fulfilled, (state) => {
        state.screeningStatus = "succeeded";
      })
      .addCase(runScreening.rejected, (state, action) => {
        state.screeningStatus = "failed";
        state.error = action.payload ?? "Failed to run screening.";
      });
  },
});

export const { clearError, clearUploadWarnings } = recruiterSlice.actions;

export const selectRecruiterState = (state: RootState) => state.recruiter;

export default recruiterSlice.reducer;
