import { ReportsView } from "@/modules/reports/components/reports-view";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function ReportsPage() {
  return (
    <SidebarInset>
      <AppHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ReportsView />
      </div>
    </SidebarInset>
  );
}
