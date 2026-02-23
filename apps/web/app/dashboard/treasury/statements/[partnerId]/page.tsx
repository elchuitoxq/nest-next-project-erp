import { Suspense } from "react";
import { TreasuryStatementView } from "@/modules/treasury/components/treasury-statement-view";
import { Loader2 } from "lucide-react";

export default function AccountStatementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TreasuryStatementView />
    </Suspense>
  );
}
