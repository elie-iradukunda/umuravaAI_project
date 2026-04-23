"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardCheck,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings2,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import { getPlatformUserDetails } from "../../lib/platform-users";
import { canManageJobs } from "../../lib/role-permissions";
import { clearStoredSessionUser } from "../../lib/session-user";
import { signOut, selectAuthState, selectCurrentUser } from "../../store/auth-slice";
import {
  loadNotifications,
  markNotificationsRead,
  selectNotifications,
  selectNotificationSummary,
} from "../../store/notification-slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

type ProtectedAppShellProps = {
  children: ReactNode;
  pageTitle: string;
  pageDescription: string;
  accent?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type HeaderIconLink = {
  label: string;
  href: string;
  icon: typeof Bell;
  showUnreadBadge?: boolean;
};

const initialsGradient: Record<string, string> = {
  talent: "from-[#8ce6b4] to-[#2fba7f]",
  "job-owner": "from-[#ffd46d] to-[#ff9f43]",
  admin: "from-[#c1b8ff] to-[#7d78ff]",
};

export const ProtectedAppShell = ({
  children,
  pageTitle,
  pageDescription,
  accent = "Role-Aware Workspace",
}: ProtectedAppShellProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { hydrated } = useAppSelector(selectAuthState);
  const currentUser = useAppSelector(selectCurrentUser);
  const notifications = useAppSelector(selectNotifications);
  const notificationSummary = useAppSelector(selectNotificationSummary);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    if (hydrated && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, hydrated, router]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void dispatch(loadNotifications());

    const interval = window.setInterval(() => {
      void dispatch(loadNotifications());
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentUser, dispatch]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncHash = () => {
      setCurrentHash(window.location.hash);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  const currentRole = currentUser
    ? getPlatformUserDetails(currentUser.roleId)
    : null;

  const navItems = useMemo<NavItem[]>(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.roleId === "talent") {
      return [
        { label: "Dashboard", href: "/workspace", icon: LayoutDashboard },
        { label: "Browse Jobs", href: "/talent/jobs", icon: BriefcaseBusiness },
        { label: "My Applications", href: "/talent/applications", icon: ClipboardCheck },
        { label: "My Profile", href: "/talent/profile", icon: UsersRound },
        { label: "Application Guide", href: "/talent/guide", icon: LineChart },
        { label: "Settings", href: "/workspace#help", icon: Settings2 },
      ];
    }

    if (currentUser.roleId === "admin") {
      return [
        { label: "Dashboard", href: "/workspace", icon: LayoutDashboard },
        { label: "System Status", href: "/workspace#system-status", icon: BriefcaseBusiness },
        { label: "AI Controls", href: "/workspace#ai-readiness", icon: ClipboardCheck },
        { label: "Insights", href: "/workspace#signals", icon: LineChart },
        { label: "Settings", href: "/workspace#system-readiness", icon: Settings2 },
      ];
    }

    return [
      { label: "Dashboard", href: "/workspace", icon: LayoutDashboard },
      {
        label: "Job Workspace",
        href: "/workspace#pipeline",
        icon: BriefcaseBusiness,
      },
      {
        label: "AI Shortlists",
        href: "/workspace#decision-center",
        icon: ClipboardCheck,
      },
      { label: "Insights", href: "/workspace#signals", icon: LineChart },
      { label: "Settings", href: "/workspace#system-readiness", icon: Settings2 },
    ];
  }, [currentUser]);

  const primaryAction = useMemo(() => {
    if (!currentRole || !currentUser) {
      return null;
    }

    if (currentUser.roleId === "job-owner" && canManageJobs(currentUser.roleId)) {
      return { label: "Create Job", href: "/jobs/new" };
    }

    return currentRole.primaryAction;
  }, [currentRole, currentUser]);

  const roleTip = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    if (currentUser.roleId === "talent") {
      return {
        title: "Candidate Tools",
        body: "Keep your profile ready, browse jobs that fit your skills, and check your applications in one place.",
        action: { label: "Browse Jobs", href: "/talent/jobs" },
      };
    }

    if (currentUser.roleId === "admin") {
      return {
        title: "Admin Scope",
        body: "This workspace is limited to system readiness, AI configuration, and platform controls. Hiring data stays inside the job-owner dashboard.",
        action: { label: "Open System Status", href: "/workspace#system-status" },
      };
    }

    return {
      title: "Hiring Workspace",
      body: "Post roles, review applicants, run AI screening, and move from intake to shortlist decisions without exposing hiring controls to other roles.",
      action: primaryAction,
    };
  }, [currentUser, primaryAction]);

  const headerIconLinks = useMemo<HeaderIconLink[]>(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.roleId === "talent") {
      return [
        {
          label: "Notifications",
          href: "/workspace#notifications",
          icon: Bell,
          showUnreadBadge: true,
        },
        {
          label: "AI Suggestions",
          href: "/workspace#suggestions",
          icon: Sparkles,
        },
        {
          label: "My Profile",
          href: "/talent/profile",
          icon: UsersRound,
        },
      ];
    }

    if (currentUser.roleId === "admin") {
      return [
        {
          label: "System Alerts",
          href: "/workspace#system-status",
          icon: Bell,
          showUnreadBadge: true,
        },
        {
          label: "AI Controls",
          href: "/workspace#ai-readiness",
          icon: Sparkles,
        },
        {
          label: "Active Role",
          href: `${pathname}#active-role`,
          icon: UsersRound,
        },
      ];
    }

    return [
      {
        label: "Notifications",
        href: "/workspace#pipeline",
        icon: Bell,
        showUnreadBadge: true,
      },
      {
        label: "AI Decision Center",
        href: "/workspace#decision-center",
        icon: Sparkles,
      },
      {
        label: "Active Role",
        href: `${pathname}#active-role`,
        icon: UsersRound,
      },
    ];
  }, [currentUser, pathname]);

  const handleLogout = () => {
    clearStoredSessionUser();
    dispatch(signOut());
    router.replace("/");
  };

  const handleHeaderIconClick = (showUnreadBadge?: boolean) => {
    if (!showUnreadBadge || !currentUser || currentUser.roleId === "talent") {
      return;
    }

    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    void dispatch(markNotificationsRead(unreadIds));
  };

  if (!hydrated || !currentUser || !currentRole) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel max-w-md p-8 text-center">
          <p className="kicker">Loading Workspace</p>
          <h2 className="section-title mt-3">Preparing your dashboard</h2>
          <p className="section-copy">
            Your role-aware workspace is loading. If no session exists, you will
            be redirected to login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-[#071328]/45 transition lg:hidden",
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-[292px] transition duration-300 lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <aside className="flex h-full flex-col overflow-y-auto bg-gradient-to-b from-[#0b2a67] via-[#103f92] to-[#081f4d] px-5 py-6 text-white shadow-[0_28px_70px_rgba(9,34,86,0.35)]">
          <div>
            <Link href="/workspace" className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.15] text-base font-semibold text-white ring-1 ring-white/[0.15]">
                UA
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d4e3ff]">
                  Umurava AI
                </p>
                <p className="mt-1 text-lg font-semibold text-white">Talent Screening OS</p>
              </div>
            </Link>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#bdd5ff]">
                    Signed In
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-white">
                    {currentUser.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#d8e7ff]">{currentRole.label}</p>
                </div>
                <span
                  className={clsx(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold text-[#071328]",
                    initialsGradient[currentUser.roleId]
                  )}
                >
                  {currentUser.initials}
                </span>
              </div>

              <div className="mt-5 space-y-2 text-sm text-[#d8e7ff]">
                <p>{currentUser.team}</p>
                <p>{currentUser.location}</p>
                <p>{currentUser.status}</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a9c4f5]">
                Workspace
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/workspace"
                    ? pathname === "/workspace" && currentHash.length === 0
                    : item.href.startsWith("/workspace#")
                      ? pathname === "/workspace" &&
                        currentHash === item.href.replace("/workspace", "")
                      : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-[#0b2a67] shadow-[0_10px_25px_rgba(15,23,42,0.16)]"
                        : "text-[#d8e7ff] hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#bdd5ff]">
                {roleTip?.title}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#e5efff]">
                {roleTip?.body}
              </p>
              {roleTip?.action ? (
                <Link
                  href={roleTip.action.href}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0b2a67] transition hover:bg-[#e9f0ff]"
                >
                  {roleTip.action.label}
                </Link>
              ) : null}
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Active session</p>
                  <p className="mt-1 text-sm text-[#d8e7ff]">
                    Sign out at any time to return to the public landing page.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.15] bg-white/10 text-white transition hover:bg-white/20"
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <main className="min-w-0 px-4 py-4 pb-8 sm:px-6 lg:ml-[292px] lg:px-8">
        <header className="sticky top-4 z-20 mx-auto max-w-7xl rounded-[32px] border border-white/80 bg-white/95 px-5 py-5 shadow-panel backdrop-blur sm:px-6 lg:px-7">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)] xl:items-center">
            <div className="flex items-start gap-4">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7e4fb] bg-[#f5f8ff] text-[#17448a] lg:hidden"
                type="button"
                onClick={() => setMobileMenuOpen((value) => !value)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div className="min-w-0">
                <p className="kicker">{accent}</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#10213c] sm:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {pageDescription}
                </p>
              </div>
            </div>

            <div
              className="rounded-[28px] border border-[#d9e6ff] bg-[#f8fbff] p-4"
              id="active-role"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {headerIconLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4fb] bg-white text-[#2559b8]"
                        aria-label={item.label}
                        onClick={() => handleHeaderIconClick(item.showUnreadBadge)}
                        title={
                          item.showUnreadBadge && notificationSummary.unread > 0
                            ? `${item.label} (${notificationSummary.unread} unread)`
                            : item.label
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {item.showUnreadBadge && notificationSummary.unread > 0 ? (
                          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e04848] px-1.5 text-[11px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(224,72,72,0.3)]">
                            {notificationSummary.unread > 99
                              ? "99+"
                              : notificationSummary.unread}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>

                <div className="rounded-[22px] border border-[#d7e4fb] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6c84b8]">
                    Active Role
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#10213c]">
                    {currentRole.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{currentUser.email}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/login" className="button-secondary">
                  Switch User
                </Link>
                {primaryAction ? (
                  <Link href={primaryAction.href} className="button-primary">
                    {primaryAction.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
};
