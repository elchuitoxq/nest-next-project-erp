import { Suspense } from "react";
import { WarehousesView } from "@/modules/inventory/components/warehouses-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Almacenes | ERP",
  description: "Gestión de almacenes y depósitos.",
};

export default function WarehousesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WarehousesView />
    </Suspense>
  );
}
