"use client";

import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./auth-slice";
import recruiterReducer from "./recruiter-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recruiter: recruiterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
