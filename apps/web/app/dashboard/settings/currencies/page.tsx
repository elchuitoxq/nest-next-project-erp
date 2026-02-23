import { Suspense } from "react";
import { CurrenciesView } from "@/modules/settings/currencies/components/currencies-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Monedas y Tasas | ERP",
  description: "Gestión de monedas y tasas de cambio.",
};

export default function CurrenciesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CurrenciesView />
    </Suspense>
  );
}
