"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { AuthBootstrap } from "./auth/auth-bootstrap";
import { store } from "../store";

type ProvidersProps = {
  children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => (
  <Provider store={store}>
    <AuthBootstrap />
    {children}
  </Provider>
);
