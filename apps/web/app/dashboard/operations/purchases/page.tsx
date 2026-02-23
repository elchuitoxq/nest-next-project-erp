import { Suspense } from "react";
import { PurchasesView } from "@/modules/orders/components/purchases-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Órdenes de Compra | ERP",
  description: "Gestión de abastecimiento y pedidos a proveedores.",
};

export default function PurchasesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PurchasesView />
    </Suspense>
  );
}
