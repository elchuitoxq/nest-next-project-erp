import { Suspense } from "react";
import { BranchesView } from "@/modules/branches/components/branches-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Sedes | ERP",
  description: "Gestión de sedes y sucursales.",
};

export default function BranchesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BranchesView />
    </Suspense>
  );
}
