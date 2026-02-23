import { Suspense } from "react";
import { PartnerStatementView } from "@/modules/partners/components/partner-statement-view";
import { Loader2 } from "lucide-react";

export default function PartnerAccountStatementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PartnerStatementView />
    </Suspense>
  );
}
