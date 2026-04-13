import { ProtectedAppShell } from "../../../../../components/layout/protected-app-shell";
import { TalentApplyPage } from "../../../../../components/talent/talent-apply-page";

export const dynamic = "force-dynamic";

export default async function TalentApplyRoute({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <ProtectedAppShell
      pageTitle="Apply To Job"
      pageDescription="Use your structured talent profile to apply directly into the recruiter screening pipeline."
      accent="Talent Application Flow"
    >
      <TalentApplyPage jobId={jobId} />
    </ProtectedAppShell>
  );
}
