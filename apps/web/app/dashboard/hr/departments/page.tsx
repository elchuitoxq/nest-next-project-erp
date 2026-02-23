import { Suspense } from "react";
import { DepartmentsView } from "@/modules/hr/components/views/departments-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Departamentos | ERP",
  description: "Gestión de la estructura organizacional.",
};

export default function DepartmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DepartmentsView />
    </Suspense>
  );
}
