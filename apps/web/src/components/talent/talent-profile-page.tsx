"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, RotateCcw, Save } from "lucide-react";

import { api } from "../../lib/api";
import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";
import {
  buildTalentProfileDefaults,
  buildTalentProfilePayload,
  buildTalentProfileValues,
  estimateTalentProfileCompletion,
  type TalentProfileValues,
} from "../../lib/talent-profile";
import { TalentProfileFields } from "./talent-profile-fields";

export const TalentProfilePage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [savedAt, setSavedAt] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const form = useForm<TalentProfileValues>({
    defaultValues: buildTalentProfileDefaults(currentUser ?? undefined),
  });

  useEffect(() => {
    if (!currentUser || currentUser.roleId !== "talent") {
      return;
    }

    let active = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError("");

      try {
        const response = await api.getTalentProfile(currentUser.id);
        if (!active) {
          return;
        }

        form.reset(buildTalentProfileValues(response.profile, currentUser));
      } catch (error) {
        if (!active) {
          return;
        }

        setProfileError(
          error instanceof Error
            ? error.message
            : "Could not load your saved profile."
        );
        form.reset(buildTalentProfileDefaults(currentUser));
      } finally {
        if (active) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [currentUser, form]);

  const values = form.watch();
  const completion = useMemo(
    () => estimateTalentProfileCompletion(values),
    [values]
  );

  if (currentUser?.roleId !== "talent") {
    return (
      <div className="panel p-8">
        <p className="kicker">Talent Access</p>
        <h2 className="section-title mt-3">
          This page is reserved for the talent account
        </h2>
        <p className="section-copy">
          Sign in with a talent account if you want to manage a candidate
          profile and apply to jobs.
        </p>
      </div>
    );
  }

  const handleSave = form.handleSubmit(async (submittedValues) => {
    if (!currentUser) {
      return;
    }

    const payload = {
      ...buildTalentProfilePayload(submittedValues),
      email: submittedValues.email.trim() || currentUser.email,
      fullName: submittedValues.fullName.trim() || currentUser.name,
      location: submittedValues.location.trim() || currentUser.location,
    };

    setProfileError("");

    try {
      const response = await api.saveTalentProfile(currentUser.id, payload);
      form.reset(buildTalentProfileValues(response.profile, currentUser));
      setSavedAt(new Date().toLocaleTimeString("en", { timeStyle: "short" }));
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Could not save your profile."
      );
    }
  });

  const resetForm = () => {
    form.reset(buildTalentProfileDefaults(currentUser ?? undefined));
    setSavedAt("");
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <div className="grid gap-6">
        <div className="panel p-6">
          <p className="kicker">Talent Profile</p>
          <h2 className="section-title mt-3">
            Fill the structured profile job owners will screen against
          </h2>
          <p className="section-copy max-w-3xl">
            Save your profile first, then reuse the same structured information
            whenever you apply for a role.
          </p>
        </div>

        {profileError ? <div className="status-note error">{profileError}</div> : null}
        {isLoadingProfile ? (
          <div className="panel p-6 text-sm text-slate-600">
            Loading your saved profile...
          </div>
        ) : null}

        <form className="grid gap-6" onSubmit={handleSave}>
          <TalentProfileFields form={form} userId={currentUser.id} />

          <div className="panel flex flex-wrap items-center gap-3 p-6">
            <button
              className="button-primary"
              type="submit"
              disabled={form.formState.isSubmitting || isLoadingProfile}
            >
              <Save className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={resetForm}
              disabled={form.formState.isSubmitting}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Form
            </button>
            {savedAt ? (
              <span className="chip">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                Saved at {savedAt}
              </span>
            ) : null}
          </div>
        </form>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="panel p-6">
          <p className="kicker">Completion</p>
          <h3 className="section-title mt-3">Profile readiness</h3>
          <p className="mt-5 text-5xl font-semibold tracking-tight text-[#0f6991]">
            {completion}%
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Aim for a high-completeness profile before applying so job owners get
            enough signal for ranking and explainability.
          </p>
        </div>

        <div className="panel p-6">
          <p className="kicker">Recommended Next Steps</p>
          <h3 className="section-title mt-3">Recommended next steps</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Save your profile so it stays attached to your account.",
              "Upload a CV if you want screening to read resume text as well.",
              "Open the Talent Jobs page and apply to a live role.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[#dbe7ff] bg-[#f8fbff] p-4"
              >
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
};
