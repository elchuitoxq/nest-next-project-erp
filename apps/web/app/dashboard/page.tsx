import { Suspense } from "react";
import { DashboardView } from "@/modules/bi/components/dashboard-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Resumen | ERP",
  description: "Panel principal del sistema.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}
