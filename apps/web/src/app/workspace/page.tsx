import { DashboardPage } from "../../components/dashboard/dashboard-page";
import { HomeShell } from "../../components/layout/home-shell";

export default function WorkspacePage() {
  return (
    <HomeShell>
      <DashboardPage />
    </HomeShell>
  );
}
