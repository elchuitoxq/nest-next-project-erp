import { Suspense } from "react";
import { TaxConceptsView } from "@/modules/settings/tax-concepts/components/tax-concepts-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Conceptos ISLR | ERP",
  description: "Catálogo de conceptos de retención ISLR.",
};

export default function TaxConceptsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TaxConceptsView />
    </Suspense>
  );
}
