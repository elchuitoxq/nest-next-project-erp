import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiscalBookRow } from "../hooks/use-fiscal-book";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface FiscalBookTableProps {
  data: FiscalBookRow[];
}

export function FiscalBookTable({ data }: FiscalBookTableProps) {
  // Calculate Totals
  const totals = data.reduce(
    (acc, row) => ({
      base: acc.base + row.totalTaxable,
      tax: acc.tax + row.taxAmount,
      retention: acc.retention + row.retentionAmount,
      total: acc.total + row.total,
    }),
    { base: 0, tax: 0, retention: 0, total: 0 },
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Fecha</TableHead>
            <TableHead>RIF / CI</TableHead>
            <TableHead>Razón Social</TableHead>
            <TableHead>Control</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Base Imp.</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead className="text-right">IVA</TableHead>
            <TableHead className="text-right">IVA Retenido</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center h-24">
                No hay movimientos en este periodo.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  {format(new Date(row.date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{row.partnerTaxId}</TableCell>
                <TableCell
                  className="max-w-[200px] truncate"
                  title={row.partnerName}
                >
                  {row.partnerName}
                </TableCell>
                <TableCell>{row.number}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.totalTaxable)}
                </TableCell>
                <TableCell className="text-right">{row.taxRate}%</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.taxAmount)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {row.retentionAmount > 0
                    ? `-${formatCurrency(row.retentionAmount)}`
                    : "-"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.total)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {/* Footer Summary */}
        {data.length > 0 && (
          <TableBody className="border-t-2 border-primary/20 bg-muted/50 font-bold">
            <TableRow>
              <TableCell colSpan={5} className="text-right">
                TOTALES
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.base)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.tax)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                -{formatCurrency(totals.retention)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        )}
      </Table>
    </div>
  );
}
