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
import type { RootState } from "./index";

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

export const loadDashboard = createAsyncThunk<
  DashboardResponse,
  void,
  { rejectValue: string }
>("recruiter/loadDashboard", async (_, thunkApi) => {
  try {
    return await api.getDashboard();
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const loadJobDetail = createAsyncThunk<
  JobDetailResponse,
  string,
  { rejectValue: string }
>("recruiter/loadJobDetail", async (jobId, thunkApi) => {
  try {
    return await api.getJobDetail(jobId);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const createJob = createAsyncThunk<
  JobRecord,
  CreateJobInput,
  { rejectValue: string }
>("recruiter/createJob", async (input, thunkApi) => {
  try {
    const response = await api.createJob(input);
    void thunkApi.dispatch(loadDashboard());
    return response.job;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const updateJob = createAsyncThunk<
  JobRecord,
  { jobId: string; input: UpdateJobInput },
  { rejectValue: string }
>("recruiter/updateJob", async ({ jobId, input }, thunkApi) => {
  try {
    const response = await api.updateJob(jobId, input);
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    return response.job;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const addApplicants = createAsyncThunk<
  number,
  { jobId: string; applicants: CreateApplicantInput[] },
  { rejectValue: string }
>("recruiter/addApplicants", async ({ jobId, applicants }, thunkApi) => {
  try {
    const response = await api.addApplicants(jobId, applicants);
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    return response.importedCount;
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const uploadApplicants = createAsyncThunk<
  string[],
  { jobId: string; files: File[] },
  { rejectValue: string }
>("recruiter/uploadApplicants", async ({ jobId, files }, thunkApi) => {
  try {
    const response = await api.uploadApplicants(jobId, files);
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
    return response.warnings ?? [];
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const runScreening = createAsyncThunk<
  number,
  string,
  { rejectValue: string }
>("recruiter/runScreening", async (jobId, thunkApi) => {
  try {
    const response = await api.runScreening(jobId);
    void thunkApi.dispatch(loadJobDetail(jobId));
    void thunkApi.dispatch(loadDashboard());
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
