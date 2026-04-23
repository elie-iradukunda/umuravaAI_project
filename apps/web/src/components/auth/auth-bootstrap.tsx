"use client";

import { useEffect } from "react";

import { readStoredSessionUser } from "../../lib/session-user";
import { hydrateSession } from "../../store/auth-slice";
import { useAppDispatch } from "../../store/hooks";

export const AuthBootstrap = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateSession(readStoredSessionUser()));
  }, [dispatch]);

  return null;
};
