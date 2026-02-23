import { Suspense } from "react";
import { DailyCloseView } from "@/modules/treasury/components/daily-close-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Cierre de Caja | ERP",
  description: "Reporte de cierre de caja diario.",
};

export default function DailyClosePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DailyCloseView />
    </Suspense>
  );
}
