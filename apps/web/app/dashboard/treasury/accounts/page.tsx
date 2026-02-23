import { Suspense } from "react";
import { AccountsView } from "@/modules/treasury/components/accounts-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Cuentas Bancarias | ERP",
  description: "Administración de cuentas bancarias y saldos.",
};

export default function BankAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AccountsView />
    </Suspense>
  );
}
