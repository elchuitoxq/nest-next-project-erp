import { Suspense } from "react";
import { BanksView } from "@/modules/settings/banks/components/banks-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Maestro de Bancos | ERP",
  description: "Gestión de entidades bancarias.",
};

export default function BanksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BanksView />
    </Suspense>
  );
}
