import { Suspense } from "react";
import { IncidentsView } from "@/modules/hr/incidents/components/incidents-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Novedades | ERP",
  description: "Registro de incidencias de nómina.",
};

export default function PayrollIncidentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <IncidentsView />
    </Suspense>
  );
}
