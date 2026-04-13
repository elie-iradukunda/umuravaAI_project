import { ProtectedAppShell } from "../../../components/layout/protected-app-shell";
import { TalentApplicationsPage } from "../../../components/talent/talent-applications-page";

export default function TalentApplicationsRoute() {
  return (
    <ProtectedAppShell
      pageTitle="My Applications"
      pageDescription="Review the jobs you already applied to, current screening status, and any ranking results available so far."
      accent="Candidate Application Tracker"
    >
      <TalentApplicationsPage />
    </ProtectedAppShell>
  );
}
