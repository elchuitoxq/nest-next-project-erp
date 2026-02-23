"use client";

import { useState, useEffect } from "react";
import { useAccountStatement } from "@/modules/treasury/hooks/use-treasury";
import { usePartner } from "@/modules/partners/hooks/use-partners";
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
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { useCurrencies } from "@/modules/settings/currencies/hooks/use-currencies";
import { StatementTable } from "@/modules/treasury/components/statement-table";

export function PartnerStatementView() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const { data: partner, isLoading: isLoadingPartner } = usePartner(params.id);
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();

  const [reportingCurrencyId, setReportingCurrencyId] = useState<string>("");

  useEffect(() => {
    if (currencies && currencies.length > 0 && !reportingCurrencyId) {
      setTimeout(() => {
        const usd = currencies.find((c) => c.code === "USD");
        if (usd) {
          setReportingCurrencyId(usd.id);
        } else {
          setReportingCurrencyId(currencies[0].id);
        }
      }, 0);
    }
  }, [currencies, reportingCurrencyId]);

  const { data: statement, isLoading: isLoadingStatement } =
    useAccountStatement(params.id, reportingCurrencyId);

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

  const currentSummary = statement?.summary || { balance: 0, unusedBalance: 0 };
  const reportingCurrencyCode = statement?.reportingCurrency || "USD";

  const displayTransactions = (statement?.transactions || []).filter(
    (t: any) => {
      const term = search.toLowerCase();
      return (
        t.reference.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    },
  );

  return (
    <SidebarInset>
      <AppHeader
        customLabels={{
          operations: "Operaciones",
          partners: "Clientes",
          [params.id]: partner?.name,
          statement: "Estado de Cuenta",
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
                <Wallet className="w-4 h-4" /> Billetera Unificada (Vista
                Cliente)
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
