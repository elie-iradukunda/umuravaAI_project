import { JobDetailPage } from "../../../components/job/job-detail-page";
import { ProtectedAppShell } from "../../../components/layout/protected-app-shell";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <ProtectedAppShell
      pageTitle="Job Workspace"
      pageDescription="Review applicants, manage intake, run screening, and inspect shortlist reasoning inside the shared hiring workspace."
      accent="Live Hiring Workspace"
    >
      <JobDetailPage jobId={jobId} />
    </ProtectedAppShell>
  );
}
