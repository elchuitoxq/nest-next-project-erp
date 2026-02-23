"use client";

import { useState } from "react";
import {
  usePayments,
  usePaymentMethods,
} from "@/modules/treasury/hooks/use-treasury";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { usePartners } from "@/modules/partners/hooks/use-partners";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Search, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, AlertCircle } from "lucide-react";
import { useVoidPayment } from "@/modules/treasury/hooks/use-void-payment";
import { PermissionsGate } from "@/components/auth/permissions-gate";
import { PERMISSIONS } from "@/config/permissions";

import { Payment, PaymentMethod } from "@/modules/treasury/types";

interface Currency {
  id: string;
  code: string;
  symbol: string;
}

// Extend PaymentMethod to include optional currency expansion if API sends it,
// otherwise we rely on mapping.
interface ExtendedPaymentMethod extends PaymentMethod {
  currency?: Currency;
}

import { PaymentDetailsDialog } from "./payment-details-dialog";

export function GlobalPaymentsTable() {
  const { data: payments, isLoading: isLoadingPayments } = usePayments();
  // Fetch a reasonable limit of partners for mapping
  const { data: partnersResponse, isLoading: isLoadingPartners } = usePartners({
    limit: 1000,
  });
  const partners = partnersResponse?.data || [];

  const { data: methods, isLoading: isLoadingMethods } = usePaymentMethods();
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentToVoid, setPaymentToVoid] = useState<Payment | null>(null);

  const voidPaymentMutation = useVoidPayment();

  // Fetch currencies
  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<Currency[]>("/settings/currencies");
      return data;
    },
  });

  const isLoading =
    isLoadingPayments ||
    isLoadingPartners ||
    isLoadingMethods ||
    isLoadingCurrencies;

  if (isLoading) {
    // Return table skeleton or overlay instead of just spinner
  }

  // Helper maps - Safe to create now that loading is done (or empty if loading)
  const partnerMap = new Map(
    partners?.map((p: { id: string; name: string }) => [p.id, p]) || [],
  );
  const methodMap = new Map<string, ExtendedPaymentMethod>(
    methods?.map((m) => [m.id, m as ExtendedPaymentMethod]) || [],
  );
  const currencyMap = new Map<string, Currency>(
    currencies?.map((c) => [c.id, c]) || [],
  );

  // Hydrate methods with currency info for filter display
  const hydratedMethods = methods?.map((m) => ({
    ...m,
    currency: currencyMap.get(m.currencyId),
  }));

  const filteredPayments =
    payments?.filter((payment: any) => {
      const partner = partnerMap.get(payment.partnerId);
      const method = methodMap.get(payment.methodId);

      const matchesSearch =
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod =
        methodFilter === "ALL" || method?.id === methodFilter;

      return matchesSearch && matchesMethod;
    }) || [];

  const sortedPayments = filteredPayments.sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-4">
      <PaymentDetailsDialog
        payment={selectedPayment}
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      />

      <AlertDialog
        open={!!paymentToVoid}
        onOpenChange={(open: boolean) => !open && setPaymentToVoid(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ¿Anular Pago?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible de forma directa y anulará los efectos
              del pago en las cuentas de banco, facturas relacionadas,
              retenciones y saldos cruzados, marcando este registro con estatus
              de Anulado (VOID).
              <br />
              <br />
              Confirme que desea anular el pago{" "}
              <strong>{paymentToVoid?.reference || "S/R"}</strong> por{" "}
              {paymentToVoid &&
                formatCurrency(
                  Number(paymentToVoid.amount),
                  currencyMap.get(paymentToVoid.currencyId)?.code || "VES",
                )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={voidPaymentMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={voidPaymentMutation.isPending}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                if (paymentToVoid) {
                  voidPaymentMutation.mutate(paymentToVoid.id, {
                    onSuccess: () => setPaymentToVoid(null),
                  });
                }
              }}
            >
              {voidPaymentMutation.isPending
                ? "Anulando..."
                : "Sí, Anular Pago"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por referencia o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los métodos</SelectItem>
              {hydratedMethods?.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.name} ({method.currency?.code || "-"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchTerm || methodFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchTerm("");
                setMethodFilter("ALL");
              }}
              title="Limpiar Filtros"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center backdrop-blur-[2px]"
            >
              <div className="bg-background/80 p-3 rounded-full shadow-lg border">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Banco / Caja</TableHead>
              <TableHead>Facturas</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {sortedPayments.length === 0 && !isLoading ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {payments?.length === 0
                      ? "No hay pagos registrados."
                      : "No se encontraron resultados con los filtros actuales."}
                  </TableCell>
                </motion.tr>
              ) : (
                sortedPayments.map((payment: any, index: number) => {
                  const partner = partnerMap.get(payment.partnerId);
                  const method = methodMap.get(payment.methodId);
                  const currency = currencyMap.get(payment.currencyId);
                  // Try to get method currency from map if not directly on method
                  const methodCurrency =
                    method?.currency ||
                    currencyMap.get(method?.currencyId || "");

                  // Fallback logic
                  const currencyCode = currency?.code || "VES";
                  const vesCurrency = currencies?.find((c) => c.code === "VES");

                  // Calculate historical VES amount if payment was in foreign currency
                  let historicalVesAmount = null;
                  if (
                    currencyCode !== "VES" &&
                    payment.exchangeRate &&
                    vesCurrency
                  ) {
                    historicalVesAmount =
                      Number(payment.amount) * Number(payment.exchangeRate);
                  }

                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.05 },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        payment.status === "VOID"
                          ? "opacity-60 bg-muted/30"
                          : "cursor-pointer"
                      }`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {new Date(payment.date).toLocaleDateString()}
                          {payment.status === "VOID" && (
                            <Badge
                              variant="destructive"
                              className="w-fit text-[10px] h-4"
                            >
                              Anulado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`font-mono text-xs ${payment.status === "VOID" ? "line-through" : ""}`}
                      >
                        {payment.reference || "-"}
                      </TableCell>
                      <TableCell>{partner?.name || "Desconocido"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{method?.name || "Otro"}</span>
                          {methodCurrency && (
                            <span className="text-xs text-muted-foreground">
                              {methodCurrency.code}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{payment.bankAccount?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {payment.allocations &&
                          payment.allocations.length > 0 ? (
                            payment.allocations.map((alloc: any, i: number) => (
                              <span
                                key={i}
                                className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded w-fit"
                              >
                                {alloc.invoiceCode}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{payment.user?.name || "Sistema"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {formatCurrency(
                              Number(payment.amount),
                              currencyCode,
                            )}
                          </span>
                          {historicalVesAmount && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                ~ {formatCurrency(historicalVesAmount, "Bs")}
                              </span>
                              <span className="text-[10px] text-muted-foreground/70">
                                @{" "}
                                {formatCurrency(
                                  Number(payment.exchangeRate),
                                  "Bs",
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSelectedPayment(payment)}
                            >
                              Ver detalles completos
                            </DropdownMenuItem>
                            {payment.status !== "VOID" && (
                              <PermissionsGate
                                permission={PERMISSIONS.FINANCE.PAYMENTS.VOID}
                              >
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10 cursor-pointer"
                                  onClick={() => setPaymentToVoid(payment)}
                                >
                                  Anular Pago
                                </DropdownMenuItem>
                              </PermissionsGate>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Mostrando {sortedPayments.length} de {payments?.length || 0} movimientos
      </div>
    </div>
  );
}
