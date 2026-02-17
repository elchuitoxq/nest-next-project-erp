"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatementTableProps {
  transactions: any[];
  reportingCurrency: string;
}

export function StatementTable({
  transactions,
  reportingCurrency,
}: StatementTableProps) {
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

  if (!transactions.length) {
    return (
      <div className="border rounded-md p-12 text-center text-muted-foreground">
        No hay movimientos registrados para mostrar en {reportingCurrency}.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead className="w-[30%]">Descripción</TableHead>
            <TableHead className="text-right">Monto Orig.</TableHead>
            <TableHead className="text-right">Tasa</TableHead>
            <TableHead className="text-right">
              Cargo ({reportingCurrency})
            </TableHead>
            <TableHead className="text-right">
              Abono ({reportingCurrency})
            </TableHead>
            <TableHead className="text-right">
              Saldo ({reportingCurrency})
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.type + t.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {format(new Date(t.date), "dd/MM/yyyy", { locale: es })}
              </TableCell>
              <TableCell>{getTypeBadge(t.type)}</TableCell>
              <TableCell className="font-mono text-sm">{t.reference}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {t.description}
              </TableCell>

              {/* Original Amount Column */}
              <TableCell className="text-right whitespace-nowrap">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-xs text-muted-foreground">
                    {t.originalCurrency}
                  </span>
                  <span>
                    {formatCurrency(t.originalAmount, t.originalCurrency)}
                  </span>
                </div>
              </TableCell>

              {/* Exchange Rate Column */}
              <TableCell className="text-right whitespace-nowrap">
                {t.originalCurrency !== reportingCurrency ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted text-xs text-muted-foreground">
                        {Number(t.exchangeRate).toFixed(2)}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tasa de cambio histórica</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Debit (Charge) */}
              <TableCell className="text-right text-red-600 font-medium whitespace-nowrap">
                {t.debit > 0 ? formatCurrency(t.debit, reportingCurrency) : "-"}
              </TableCell>

              {/* Credit (Payment) */}
              <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">
                {t.credit > 0
                  ? formatCurrency(t.credit, reportingCurrency)
                  : "-"}
              </TableCell>

              {/* Running Balance */}
              <TableCell
                className={cn(
                  "text-right font-bold whitespace-nowrap",
                  t.balance > 0 ? "text-red-600" : "text-green-600",
                )}
              >
                {formatCurrency(t.balance, reportingCurrency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
