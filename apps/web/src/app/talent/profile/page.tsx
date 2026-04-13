import { ProtectedAppShell } from "../../../components/layout/protected-app-shell";
import { TalentProfilePage } from "../../../components/talent/talent-profile-page";

export default function TalentProfileRoute() {
  return (
    <ProtectedAppShell
      pageTitle="Talent Profile"
      pageDescription="Build a structured candidate profile that matches the screening schema recruiters use to evaluate applications."
      accent="Candidate Workspace"
    >
      <TalentProfilePage />
    </ProtectedAppShell>
  );
}
