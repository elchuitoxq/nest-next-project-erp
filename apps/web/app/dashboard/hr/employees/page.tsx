import { Suspense } from "react";
import { EmployeesView } from "@/modules/hr/components/views/employees-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Empleados | ERP",
  description: "Gestión de personal y nómina.",
};

export default function EmployeesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <EmployeesView />
    </Suspense>
  );
}
