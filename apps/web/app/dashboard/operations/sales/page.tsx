import { Suspense } from "react";
import { SalesView } from "@/modules/orders/components/sales-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Pedidos de Venta | ERP",
  description: "Gestión y seguimiento de pedidos de clientes.",
};

export default function SalesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SalesView />
    </Suspense>
  );
}
