"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccountStatement } from "@/modules/treasury/hooks/use-treasury";
import { usePartner } from "@/modules/partners/hooks/use-partners";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SidebarInset } from "@/components/ui/sidebar";
// If AppHeader is "@/components/app-header", use that. The file showed "@/components/layout/app-header" which might be wrong based on previous contexts, but let's stick to what was there or fix it if it errors.
// Wait, one of the previous errors was "AppHeader is not defined".
// In step 489 clean view, it says: import { AppHeader } from "@/components/layout/app-header";
// I will keep it as is.
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { useCurrencies } from "@/modules/settings/currencies/hooks/use-currencies";
import { StatementTable } from "@/modules/treasury/components/statement-table";

export default function AccountStatementPage() {
  const router = useRouter();
  const params = useParams() as { partnerId: string };
  const { data: partner, isLoading: isLoadingPartner } = usePartner(
    params.partnerId,
  );

  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();

  // Default to USD if available, otherwise first currency
  // Ideally this state should initialize after currencies load, but for now we default to empty/undefined
  // and effect sets it once data is ready.
  const [reportingCurrencyId, setReportingCurrencyId] = useState<string>("");

  useEffect(() => {
    if (currencies && currencies.length > 0 && !reportingCurrencyId) {
      const usd = currencies.find((c) => c.code === "USD");
      if (usd) {
        setReportingCurrencyId(usd.id);
      } else {
        setReportingCurrencyId(currencies[0].id);
      }
    }
  }, [currencies, reportingCurrencyId]);

  const { data: statement, isLoading: isLoadingStatement } =
    useAccountStatement(params.partnerId, reportingCurrencyId);

  const [search, setSearch] = useState("");

  if (isLoadingPartner || isLoadingStatement || isLoadingCurrencies) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return <div>Cliente no encontrado</div>;
  }

  const currentSummary = statement?.summary || {
    balance: 0,
    unusedBalance: 0,
  };

  const reportingCurrencyCode = statement?.reportingCurrency || "USD";

  // Filter for display
  const displayTransactions = (statement?.transactions || []).filter(
    (t: any) => {
      const term = search.toLowerCase();
      return (
        t.reference.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    },
  );
  // Note: Backend returns newest first (reverse chronological) or oldest first?
  // Backend sorts Chronologically (Oldest -> Newest) then .reverse() at end of service.
  // So it returns Newest -> Oldest.
  // The table usually shows Newest top.

  return (
    <SidebarInset>
      <AppHeader
        customLabels={{
          [params.partnerId]: partner?.name || "Estado de Cuenta",
        }}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {partner.name}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Billetera Unificada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              Moneda de Reporte:
            </span>
            <Select
              value={reportingCurrencyId}
              onValueChange={setReportingCurrencyId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="premium-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Global ({reportingCurrencyCode})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-3xl font-bold",
                  currentSummary.balance > 0
                    ? "text-red-600"
                    : "text-green-600",
                )}
              >
                {formatCurrency(currentSummary.balance, reportingCurrencyCode)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentSummary.balance > 0
                  ? "Cuentas por Cobrar"
                  : "Pasivo (Saldo a Favor)"}
              </p>
            </CardContent>
          </Card>

          {/* Unused balance logic might need review for Unified view.
              For now, showing what backend returns if available. 
              The backend returns `summary.balance`. `unusedBalance` might not be unified easily 
              unless converted. The backend logic *does* convert `unusedBalance`? 
              Checking backend logic... it calculates `summary` PER CURRENCY. 
              Wait, the backend `getAccountStatement` I wrote returns `usage` logic simplified. 
              Actually, I changed the `summary` structure in the backend?
              Let's check the backend return type in previous step.
              
              Backend Step 442:
              return {
                 reportingCurrency: targetCurrencyCode,
                 summary: {
                    balance: runningBalance,
                 },
                 transactions: ...
              }
              
              So `unusedBalance` is missing from the new unified summary! 
              I removed it because calculating "Unused Balance" in a unified way is tricky 
              (a 100 USD unused balance is 100 USD, a 4000 VES unused is 100 USD... 
              so we COULD sum them up converted).
              
              If the frontend expects it, I should hide it or re-implement it. 
              For now, let's HIDE the "Saldo Sin Ocupar" card if it's 0 or undefined, 
              or just show Global Balance.
          */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial Unificado ({reportingCurrencyCode})</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Consolidado de operaciones referenciadas a{" "}
                {reportingCurrencyCode}.
              </CardDescription>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar referencia o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StatementTable
              transactions={displayTransactions}
              reportingCurrency={reportingCurrencyCode}
            />
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
