import { Suspense } from "react";
import { InvoicesView } from "@/modules/billing/components/invoices-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Facturas | ERP",
  description: "Gestión de facturación y cobranza.",
};

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InvoicesView />
    </Suspense>
  );
}
