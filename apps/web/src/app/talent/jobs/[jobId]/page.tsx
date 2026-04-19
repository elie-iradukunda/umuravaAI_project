import { ProtectedAppShell } from "../../../../components/layout/protected-app-shell";
import { TalentJobDetailPage } from "../../../../components/talent/talent-job-detail-page";

export const dynamic = "force-dynamic";

export default async function TalentJobDetailRoute({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <ProtectedAppShell
      pageTitle="Job Details"
      pageDescription="Review the full hiring brief, required skills, and role expectations before you apply."
      accent="Talent Job Detail"
    >
      <TalentJobDetailPage jobId={jobId} />
    </ProtectedAppShell>
  );
}
