"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccountStatement } from "@/modules/treasury/hooks/use-treasury";
import { usePartner } from "@/modules/partners/hooks/use-partners";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function AccountStatementPage() {
  const router = useRouter();
  const params = useParams() as { partnerId: string };
  const { data: partner, isLoading: isLoadingPartner } = usePartner(
    params.partnerId,
  );
  const { data: statement, isLoading: isLoadingStatement } =
    useAccountStatement(params.partnerId);

  const [selectedCurrency, setSelectedCurrency] = useState("VES");
  const [search, setSearch] = useState("");

  const currenciesList = statement?.summary
    ? Object.keys(statement.summary)
    : [];
  // Auto-select logic: Use selected if valid, otherwise first available, otherwise VES
  const effectiveCurrency = currenciesList.includes(selectedCurrency)
    ? selectedCurrency
    : currenciesList[0] || "VES";

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INVOICE":
        return <Badge variant="default">Factura</Badge>;
      case "PAYMENT":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Pago
          </Badge>
        );
      case "CREDIT_NOTE":
        return <Badge variant="destructive">Nota de Crédito</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const processedTransactions = useMemo(() => {
    if (!statement?.transactions) return [];

    // Filter and Sort Chronologically
    const filtered = statement.transactions
      .filter((t: any) => t.currency === selectedCurrency)
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    // Calculate Accumulated Balance
    let runningBalance = 0;
    return filtered.map((t: any) => {
      runningBalance += t.debit - t.credit;
      return { ...t, balance: runningBalance };
    });
  }, [statement, selectedCurrency]);

  if (isLoadingPartner || isLoadingStatement) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return <div>Cliente no encontrado</div>;
  }

  const currentSummary = statement?.summary?.[selectedCurrency] || {
    balance: 0,
    unusedBalance: 0,
  };

  // Apply Search and Reverse for Display
  const displayTransactions = processedTransactions
    .filter((t: any) => {
      const term = search.toLowerCase();
      return (
        t.reference.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    })
    .reverse();

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb
            customLabels={{
              [params.partnerId]: partner?.name || "Estado de Cuenta",
            }}
          />
        </div>
      </header>

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
                <Wallet className="w-4 h-4" /> Billetera Multimoneda
              </p>
            </div>
          </div>

          {currenciesList.length > 0 && (
            <Tabs value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <TabsList>
                {currenciesList.map((curr) => (
                  <TabsTrigger key={curr} value={curr}>
                    {curr}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="premium-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Global (Deuda)
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
                {formatCurrency(currentSummary.balance, selectedCurrency)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentSummary.balance > 0
                  ? "Cuentas por Cobrar"
                  : "Pasivo (Saldo a Favor)"}
              </p>
            </CardContent>
          </Card>

          <Card className="premium-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Sin Ocupar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(currentSummary.unusedBalance, selectedCurrency)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Disponible para cruce
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos ({selectedCurrency})</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Detalle cronológico de operaciones en {selectedCurrency}.
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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Debe (Cargo)</TableHead>
                    <TableHead className="text-right">Haber (Abono)</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.map((t: any) => (
                    <TableRow key={t.type + t.id}>
                      <TableCell className="font-medium">
                        {format(new Date(t.date), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>{getTypeBadge(t.type)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {t.reference}
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium whitespace-nowrap">
                        {t.debit > 0
                          ? formatCurrency(t.debit, selectedCurrency)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">
                        {t.credit > 0 ? (
                          formatCurrency(t.credit, selectedCurrency)
                        ) : t.realAmount > 0 && t.type === "PAYMENT" ? (
                          <span
                            className="text-muted-foreground italic"
                            title="Uso de Saldo a Favor"
                          >
                            {formatCurrency(t.realAmount, selectedCurrency)}*
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold whitespace-nowrap",
                          t.balance > 0 ? "text-red-600" : "text-gray-900",
                          t.credit === 0 && t.realAmount > 0 && "opacity-50",
                        )}
                      >
                        {formatCurrency(t.balance, selectedCurrency)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!displayTransactions.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No hay movimientos registrados en {selectedCurrency}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
