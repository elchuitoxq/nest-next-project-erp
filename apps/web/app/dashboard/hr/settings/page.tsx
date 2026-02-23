import { Suspense } from "react";
import { HrSettingsView } from "@/modules/hr/components/views/hr-settings-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Configuración RRHH | ERP",
  description: "Parámetros de nómina y estructura organizacional.",
};

export default function PayrollSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <HrSettingsView />
    </Suspense>
  );
}
