import { ProtectedAppShell } from "../../../components/layout/protected-app-shell";
import { TalentApplicationGuidePage } from "../../../components/talent/talent-application-guide-page";

export default function TalentGuideRoute() {
  return (
    <ProtectedAppShell
      pageTitle="Application Guide"
      pageDescription="Review the full talent application flow, preparation checklist, and what happens after you submit a role."
      accent="Candidate Guidance"
    >
      <TalentApplicationGuidePage />
    </ProtectedAppShell>
  );
}
