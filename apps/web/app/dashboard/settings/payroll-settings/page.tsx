import { Suspense } from "react";
import { PayrollSettingsView } from "@/modules/settings/components/payroll-settings-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Contribuciones de Nómina | ERP",
  description: "Tasas de aportes obligatorios.",
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
      <PayrollSettingsView />
    </Suspense>
  );
}
