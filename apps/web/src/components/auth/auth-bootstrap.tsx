"use client";

import { useEffect } from "react";

import { authStorageKey } from "../../lib/demo-users";
import { hydrateSession } from "../../store/auth-slice";
import { useAppDispatch } from "../../store/hooks";

export const AuthBootstrap = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const storedUserId =
      typeof window !== "undefined"
        ? window.localStorage.getItem(authStorageKey)
        : null;

    dispatch(hydrateSession(storedUserId));
  }, [dispatch]);

  return null;
};
