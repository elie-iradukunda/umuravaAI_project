"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, RotateCcw, Save, Trash2 } from "lucide-react";

import { selectCurrentUser } from "../../store/auth-slice";
import { useAppSelector } from "../../store/hooks";
import {
  buildTalentProfileDefaults,
  clearTalentProfileDraft,
  estimateTalentProfileCompletion,
  loadTalentProfileDraft,
  saveTalentProfileDraft,
  type TalentProfileValues,
} from "../../lib/talent-profile";
import { TalentProfileFields } from "./talent-profile-fields";

export const TalentProfilePage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [savedAt, setSavedAt] = useState<string>("");

  const form = useForm<TalentProfileValues>({
    defaultValues: buildTalentProfileDefaults(currentUser ?? undefined),
  });

  useEffect(() => {
    form.reset(loadTalentProfileDraft(currentUser ?? undefined));
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
          Switch to the demo talent login if you want to fill a candidate profile
          and apply to jobs.
        </p>
      </div>
    );
  }

  const handleSave = form.handleSubmit((submittedValues) => {
    saveTalentProfileDraft(submittedValues, currentUser ?? undefined);
    setSavedAt(new Date().toLocaleTimeString("en", { timeStyle: "short" }));
  });

  const loadDemoProfile = () => {
    form.reset(buildTalentProfileDefaults(currentUser ?? undefined));
    setSavedAt("");
  };

  const clearProfile = () => {
    clearTalentProfileDraft(currentUser ?? undefined);
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

        <form className="grid gap-6" onSubmit={handleSave}>
          <TalentProfileFields form={form} />

          <div className="panel flex flex-wrap items-center gap-3 p-6">
            <button className="button-primary" type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={loadDemoProfile}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Load Demo Example
            </button>
            <button className="button-danger" type="button" onClick={clearProfile}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Draft
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
          <p className="kicker">Demo Guidance</p>
          <h3 className="section-title mt-3">Recommended next steps</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Review the prefilled demo example and adjust it if you want.",
              "Save your profile so it is ready for one-click applications.",
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
