import { Suspense } from "react";
import { MethodsView } from "@/modules/settings/components/methods-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Métodos de Pago | ERP",
  description: "Configuración de métodos de pago.",
};

export default function MethodsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MethodsView />
    </Suspense>
  );
}
