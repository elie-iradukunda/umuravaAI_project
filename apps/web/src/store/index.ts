"use client";

import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./auth-slice";
import notificationReducer from "./notification-slice";
import recruiterReducer from "./recruiter-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    recruiter: recruiterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
