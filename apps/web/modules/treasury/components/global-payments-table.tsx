"use client";

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
import { Loader2 } from "lucide-react";

interface Currency {
  id: string;
  code: string;
  symbol: string;
}

export function GlobalPaymentsTable() {
  const { data: payments, isLoading } = usePayments();
  const { data: partners } = usePartners();
  const { data: methods } = usePaymentMethods();

  // Fetch currencies
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get("/finance/currencies");
      return data;
    },
  });

  // Helper maps
  const partnerMap = new Map(partners?.map((p) => [p.id, p]));
  const methodMap = new Map(methods?.map((m) => [m.id, m]));
  const currencyMap = new Map<string, Currency>(
    currencies?.map((c: Currency) => [c.id, c]),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const sortedPayments = payments
    ? [...payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    : [];

  return (
    <div className="border rounded-md">
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
          {sortedPayments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No hay pagos registrados.
              </TableCell>
            </TableRow>
          ) : (
            sortedPayments.map((payment) => {
              const partner = partnerMap.get(payment.partnerId);
              const method = methodMap.get(payment.methodId);
              const currency = currencyMap.get(payment.currencyId);

              // Fallback logic
              const currencyCode = currency?.code || "VES";

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.reference || "-"}
                  </TableCell>
                  <TableCell>{partner?.name || "Desconocido"}</TableCell>
                  <TableCell>{method?.name || "Otro"}</TableCell>
                  <TableCell>{payment.bankAccount?.name || "-"}</TableCell>
                  <TableCell>{payment.user?.name || "Sistema"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(payment.amount), currencyCode)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
