import { Suspense } from "react";
import { MovesView } from "@/modules/inventory/components/moves-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Movimientos | ERP",
  description: "Historial de movimientos de inventario.",
};

export default function InventoryMovesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MovesView />
    </Suspense>
  );
}
