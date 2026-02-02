"use client";

import { useState } from "react";
import {
  usePayments,
  usePaymentMethods,
} from "@/modules/treasury/hooks/use-treasury";
import { useQuery } from "@tanstack/react-query";
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
import { motion, AnimatePresence } from "framer-motion";

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

  // Fetch currencies
  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
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
        partner?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod =
        methodFilter === "ALL" || method?.id === methodFilter;

      return matchesSearch && matchesMethod;
    }) || [];

  const sortedPayments = filteredPayments.sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-4">
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
              <TableHead>Responsable</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {sortedPayments.length === 0 && !isLoading ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TableCell
                    colSpan={7}
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
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        {new Date(payment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
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
