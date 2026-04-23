"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  BriefcaseBusiness,
  LockKeyhole,
  Mail,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { api } from "../../lib/api";
import { persistSessionUser } from "../../lib/session-user";
import { signIn, selectAuthState, selectCurrentUser } from "../../store/auth-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

type LoginFormValues = {
  email: string;
  password: string;
};

const platformHighlights = [
  {
    label: "Multi-role workspace",
    value: "3 focused dashboards",
    icon: BriefcaseBusiness,
  },
  {
    label: "Screening stack",
    value: "Profiles + CV uploads",
    icon: Sparkles,
  },
  {
    label: "Operational visibility",
    value: "Mongo-ready workspace",
    icon: ShieldCheck,
  },
];

export const LoginPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hydrated } = useAppSelector(selectAuthState);
  const currentUser = useAppSelector(selectCurrentUser);
  const [error, setError] = useState("");

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (hydrated && currentUser) {
      router.replace("/workspace");
    }
  }, [currentUser, hydrated, router]);

  const loginWithUser = (user: ReturnType<typeof persistSessionUser>) => {
    dispatch(signIn(user));
    router.replace("/workspace");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await api.login(values);
      const user = persistSessionUser(response.user);
      setError("");
      loginWithUser(user);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Incorrect email or password."
      );
    }
  });

  return (
    <div className="min-h-screen bg-[#eef3fb]">
      <div className="grid min-h-screen xl:grid-cols-[1.12fr_0.88fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0b2a67] via-[#1d54ad] to-[#6ba8ff] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,211,107,0.18),transparent_26%)]" />
          <div className="relative mx-auto flex h-full max-w-3xl flex-col">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white/90 backdrop-blur-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.15] font-semibold">
                UA
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                  Umurava AI
                </p>
                <p className="text-sm font-medium text-white">Talent Screening Platform</p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d6e4ff]">
                Role-Based Access
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Role-based hiring dashboards that actually feel product-ready.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#e8f0ff]">
                Sign in as talent, job owner, or admin and move through the
                exact workspace each role needs, from profile creation and job
                application to hiring decisions and platform oversight.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {platformHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[28px] border border-white/[0.15] bg-white/10 p-5 text-white backdrop-blur-sm"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.15] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-sm text-[#dce8ff]">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-[32px] border border-white/[0.15] bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.15] text-white">
                  <Radar className="h-5 w-5" />
                </span>
                <div>
                <p className="text-lg font-semibold text-white">What you can do right now</p>
                <p className="mt-1 text-sm text-[#dce8ff]">
                  Login, switch users, create jobs, complete a talent profile,
                  apply to open roles, inspect hiring pipelines, and show
                  admin-ready platform controls live.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[580px] rounded-[34px] border border-white/80 bg-white p-7 shadow-[0_26px_70px_rgba(15,23,42,0.12)] sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Login</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10213c]">
                  Enter the workspace
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Sign in with the account you created and continue into the
                  workspace for your role.
                </p>
              </div>
              <Link
                href="/"
                className="hidden rounded-full border border-[#d7e4fb] bg-[#f5f8ff] px-4 py-2 text-sm font-medium text-[#2559b8] sm:inline-flex"
              >
                Back Home
              </Link>
            </div>

            <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
              <div>
                <label className="field-label">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-12" {...form.register("email")} />
                </div>
              </div>

              <div>
                <label className="field-label">Password</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-12" type="password" {...form.register("password")} />
                </div>
              </div>

              {error ? <div className="status-note error">{error}</div> : null}

              <button className="button-primary w-full" type="submit">
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 rounded-[28px] border border-[#e1e9f8] bg-white p-5">
              <p className="text-sm font-semibold text-[#10213c]">Account access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Every sign-in uses the live account endpoint, and each role
                lands in its own scoped workspace after authentication.
              </p>
              <div className="mt-4">
                <Link href="/signup" className="button-secondary">
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
