"use client";

import type { PlatformUserId } from "../../lib/platform-users";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, MapPin, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { api } from "../../lib/api";
import { authStorageKey, cacheAuthenticatedUser } from "../../lib/demo-users";
import { platformUsers } from "../../lib/platform-users";
import { signIn } from "../../store/auth-slice";
import { useAppDispatch } from "../../store/hooks";

type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  roleId: PlatformUserId;
  location: string;
};

export const SignupPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");

  const form = useForm<SignupFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "talent",
      location: "Kigali, Rwanda",
    },
  });

  const selectedRoleId = form.watch("roleId");

  const onSubmit = form.handleSubmit(async (values) => {
    setError("");

    try {
      const response = await api.signup(values);
      const user = cacheAuthenticatedUser(response.user);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(authStorageKey, user.id);
      }

      dispatch(signIn(user.id));
      router.replace("/workspace");
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "Could not create account."
      );
    }
  });

  return (
    <div className="min-h-screen bg-[#eef3fb]">
      <div className="grid min-h-screen xl:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#07316b] via-[#1558ad] to-[#63b0ff] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,224,144,0.2),transparent_24%)]" />
          <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white/90 backdrop-blur-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.15] font-semibold">
                  UA
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                    Umurava AI
                  </p>
                  <p className="text-sm font-medium text-white">
                    Role-Based Sign Up
                  </p>
                </div>
              </div>

              <div className="mt-12 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d6e4ff]">
                  Public Access
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Create your account and enter the workspace that fits your role.
                </h1>
                <p className="mt-6 text-base leading-8 text-[#e8f0ff]">
                  Choose talent, job owner, or admin. We will create an
                  API-backed account and take you into the correct
                  role-aware workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: UserRound,
                  label: "Role selection",
                  value: "3 workspace personas",
                },
                {
                  icon: ShieldCheck,
                  label: "Account storage",
                  value: "Mongo-backed users",
                },
                {
                  icon: ArrowRight,
                  label: "Quick start",
                  value: "Create account -> sign in -> work",
                },
              ].map((item) => {
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
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[620px] rounded-[34px] border border-white/80 bg-white p-7 shadow-[0_26px_70px_rgba(15,23,42,0.12)] sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Create Account</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10213c]">
                  Start with your platform role
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Fill a few details below, choose the role you want, and we
                  will create a real backend user account for this prototype.
                </p>
              </div>
              <Link href="/" className="button-secondary hidden sm:inline-flex">
                Back Home
              </Link>
            </div>

            <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
              <div>
                <label className="field-label">Full name</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-12" {...form.register("name", { required: true })} />
                </div>
              </div>

              <div>
                <label className="field-label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-12"
                    type="email"
                    {...form.register("email", { required: true })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Role</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {platformUsers.map((role) => {
                    const isSelected = selectedRoleId === role.id;

                    return (
                      <label
                        key={role.id}
                        className={`cursor-pointer rounded-[24px] border p-4 transition ${
                          isSelected
                            ? "border-[#2463eb] bg-[#f4f8ff] shadow-[0_16px_30px_rgba(36,99,235,0.1)]"
                            : "border-[#d7e4fb] bg-white hover:border-[#9bb9f4]"
                        }`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          value={role.id}
                          {...form.register("roleId", { required: true })}
                        />
                        <p className="text-sm font-semibold text-[#10213c]">{role.label}</p>
                        <p className="mt-1 text-sm text-[#31538e]">{role.title}</p>
                        <p className="mt-3 text-xs leading-6 text-slate-600">
                          {role.summary}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="field-label">Password</label>
                <input
                  className="input"
                  type="password"
                  {...form.register("password", {
                    required: true,
                    minLength: 6,
                  })}
                />
              </div>

              <div>
                <label className="field-label">Location</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-12"
                    {...form.register("location", { required: true })}
                  />
                </div>
              </div>

              {error ? <div className="status-note error">{error}</div> : null}

              <button
                className="button-primary w-full"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 rounded-[28px] border border-[#d9e6ff] bg-[#f8fbff] p-5">
              <p className="text-sm font-semibold text-[#10213c]">
                Already have a demo or local account?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Go to login and enter your email and password to continue into
                your workspace.
              </p>
              <div className="mt-4">
                <Link href="/login" className="button-secondary">
                  Go To Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
