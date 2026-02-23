import { Suspense } from "react";
import { PartnersView } from "@/modules/partners/components/partners-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Clientes y Socios | ERP",
  description: "Gestión de clientes y proveedores.",
};

export default function PartnersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PartnersView />
    </Suspense>
  );
}
