import { Suspense } from "react";
import { TreasuryView } from "@/modules/treasury/components/treasury-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Pagos y Cobranzas | ERP",
  description: "Gestión centralizada de pagos y flujo de caja.",
};

export default function TreasuryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TreasuryView />
    </Suspense>
  );
}
