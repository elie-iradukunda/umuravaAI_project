import { ProtectedAppShell } from "../../../components/layout/protected-app-shell";
import { TalentJobsPage } from "../../../components/talent/talent-jobs-page";

export default function TalentJobsRoute() {
  return (
    <ProtectedAppShell
      pageTitle="Open Jobs"
      pageDescription="Browse live roles, compare requirements, and apply with your saved structured profile."
      accent="Talent Opportunity Hub"
    >
      <TalentJobsPage />
    </ProtectedAppShell>
  );
}
