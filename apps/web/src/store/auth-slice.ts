"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { getUserById } from "../lib/demo-users";
import type { RootState } from "./index";

type AuthState = {
  hydrated: boolean;
  currentUserId: string | null;
};

const initialState: AuthState = {
  hydrated: false,
  currentUserId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateSession(state, action: PayloadAction<string | null>) {
      state.currentUserId = action.payload;
      state.hydrated = true;
    },
    signIn(state, action: PayloadAction<string>) {
      state.currentUserId = action.payload;
      state.hydrated = true;
    },
    signOut(state) {
      state.currentUserId = null;
      state.hydrated = true;
    },
  },
});

export const { hydrateSession, signIn, signOut } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) =>
  getUserById(state.auth.currentUserId);
export const selectCurrentRoleId = (state: RootState) =>
  getUserById(state.auth.currentUserId)?.roleId ?? null;

export default authSlice.reducer;
