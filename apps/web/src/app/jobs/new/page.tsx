import { JobForm } from "../../../components/job/job-form";
import { ProtectedAppShell } from "../../../components/layout/protected-app-shell";

export default function NewJobPage() {
  return (
    <ProtectedAppShell
      pageTitle="Create Hiring Brief"
      pageDescription="Set the role, shortlist target, skills, and ideal candidate profile that the screening engine should evaluate against."
      accent="Recruiter Authoring Space"
    >
      <section className="grid gap-6">
        <div className="panel p-6">
          <p className="kicker">Create Job</p>
          <h2 className="section-title mt-3">
            Define the hiring brief the screening engine will evaluate against.
          </h2>
          <p className="section-copy max-w-3xl">
            Capture the role context, shortlist size, required skills, and the
            ideal candidate profile. This becomes the backbone for ranked
            candidate evaluation and explanations.
          </p>
        </div>
        <JobForm mode="create" />
      </section>
    </ProtectedAppShell>
  );
}
