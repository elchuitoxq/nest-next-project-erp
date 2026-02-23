import { Suspense } from "react";
import { RetentionsView } from "@/modules/treasury/components/retentions-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Retenciones | ERP",
  description: "Consulta de retenciones de IVA e ISLR.",
};

export default function RetentionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RetentionsView />
    </Suspense>
  );
}
