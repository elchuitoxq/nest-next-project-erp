import { Suspense } from "react";
import { ProductsView } from "@/modules/inventory/components/products-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Productos | ERP",
  description: "Catálogo de productos y servicios.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProductsView />
    </Suspense>
  );
}
