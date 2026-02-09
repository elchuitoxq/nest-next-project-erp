import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Payment } from "../types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PaymentDetailsDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsDialog({
  payment,
  open,
  onOpenChange,
}: PaymentDetailsDialogProps) {
  if (!payment) return null;

  // Calculate totals from allocations to verify against payment amount
  const totalAllocated =
    payment.allocations?.reduce(
      (sum, alloc) => sum + Number(alloc.amount || 0),
      0,
    ) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col p-6 gap-6 rounded-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Detalle de Pago
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-lg px-3 py-1 font-mono tracking-wider"
            >
              {payment.reference || "S/R"}
            </Badge>
          </div>
          <DialogDescription className="text-base">
            Realizado el {new Date(payment.date).toLocaleDateString()}
            {payment.bankAccount?.name && (
              <span className="block mt-1 text-primary font-medium">
                {payment.bankAccount.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              Monto Total
            </p>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(Number(payment.amount), "VES")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {payment.methodName || "Método desconocido"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              Facturas Pagadas
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {payment.allocations?.length || 0}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Desglose de Facturas
            <Separator className="flex-1" />
          </h3>

          <div className="h-[250px] overflow-auto border rounded-lg bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="font-bold text-foreground">
                    Código de Factura
                  </TableHead>
                  <TableHead className="text-right font-bold text-foreground">
                    Monto Abonado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.allocations && payment.allocations.length > 0 ? (
                  payment.allocations.map((alloc, index) => (
                    <TableRow
                      key={index}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="font-mono font-medium">
                        {alloc.invoiceCode}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(Number(alloc.amount), "VES")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground py-8"
                    >
                      <p>
                        No se encontró el detalle de asignación para este pago.
                      </p>
                      {payment.invoiceId && (
                        <Badge variant="secondary" className="mt-2">
                          Pago directo a factura antigua
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <div className="flex-1 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Asignado:</span>
            <span className="font-mono font-bold">
              {formatCurrency(totalAllocated, "VES")}
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
