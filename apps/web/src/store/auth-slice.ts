"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { SessionUser } from "../lib/session-user";
import type { RootState } from "./index";

type AuthState = {
  hydrated: boolean;
  currentUser: SessionUser | null;
};

const initialState: AuthState = {
  hydrated: false,
  currentUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateSession(state, action: PayloadAction<SessionUser | null>) {
      state.currentUser = action.payload;
      state.hydrated = true;
    },
    signIn(state, action: PayloadAction<SessionUser>) {
      state.currentUser = action.payload;
      state.hydrated = true;
    },
    signOut(state) {
      state.currentUser = null;
      state.hydrated = true;
    },
  },
});

export const { hydrateSession, signIn, signOut } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.currentUser;
export const selectCurrentUserId = (state: RootState) =>
  state.auth.currentUser?.id ?? null;
export const selectCurrentRoleId = (state: RootState) =>
  state.auth.currentUser?.roleId ?? null;

export default authSlice.reducer;
