import { Suspense } from "react";
import { PositionsView } from "@/modules/hr/components/views/positions-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Cargos y Salarios | ERP",
  description: "Administración de puestos de trabajo y tabuladores.",
};

export default function PositionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PositionsView />
    </Suspense>
  );
}
