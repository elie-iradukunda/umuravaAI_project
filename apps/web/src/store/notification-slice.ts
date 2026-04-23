"use client";

import type {
  NotificationRecord,
  NotificationSummary,
  NotificationsResponse,
} from "@umurava/shared";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../lib/api";
import { hydrateSession, selectCurrentUserId, signIn, signOut } from "./auth-slice";
import type { RootState } from "./index";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

type NotificationState = {
  data: NotificationsResponse | null;
  status: AsyncStatus;
  markStatus: AsyncStatus;
  error: string | null;
  lastLoadedAt: number | null;
};

const initialState: NotificationState = {
  data: null,
  status: "idle",
  markStatus: "idle",
  error: null,
  lastLoadedAt: null,
};

const emptyNotifications: NotificationRecord[] = [];
const emptyNotificationSummary: NotificationSummary = {
  total: 0,
  read: 0,
  unread: 0,
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

export const loadNotifications = createAsyncThunk<
  NotificationsResponse,
  void,
  { state: RootState; rejectValue: string }
>("notifications/loadNotifications", async (_, thunkApi) => {
  try {
    return await api.getNotifications(requireCurrentUserId(thunkApi.getState()));
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

export const markNotificationsRead = createAsyncThunk<
  NotificationsResponse,
  string[],
  { state: RootState; rejectValue: string }
>("notifications/markNotificationsRead", async (notificationIds, thunkApi) => {
  try {
    if (notificationIds.length === 0) {
      const current = thunkApi.getState().notifications.data;

      if (current) {
        return current;
      }

      return await api.getNotifications(
        requireCurrentUserId(thunkApi.getState())
      );
    }

    return await api.markNotificationsRead(
      requireCurrentUserId(thunkApi.getState()),
      notificationIds
    );
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error));
  }
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.lastLoadedAt = Date.now();
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load notifications.";
      })
      .addCase(markNotificationsRead.pending, (state) => {
        state.markStatus = "loading";
        state.error = null;
      })
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        state.markStatus = "succeeded";
        state.data = action.payload;
        state.lastLoadedAt = Date.now();
      })
      .addCase(markNotificationsRead.rejected, (state, action) => {
        state.markStatus = "failed";
        state.error = action.payload ?? "Failed to update notifications.";
      })
      .addCase(signIn, () => initialState)
      .addCase(signOut, () => initialState)
      .addCase(hydrateSession, () => initialState);
  },
});

export const selectNotificationsState = (state: RootState) => state.notifications;
export const selectNotifications = (state: RootState) =>
  state.notifications.data?.notifications ?? emptyNotifications;
export const selectNotificationSummary = (state: RootState) =>
  state.notifications.data?.summary ?? emptyNotificationSummary;
export const selectUnreadNotificationCount = (state: RootState) =>
  selectNotificationSummary(state).unread;

export default notificationSlice.reducer;
