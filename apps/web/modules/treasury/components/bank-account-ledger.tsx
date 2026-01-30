
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePayments } from "../hooks/use-treasury";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface BankAccountLedgerProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
}

export function BankAccountLedger({
  isOpen,
  onClose,
  account,
}: BankAccountLedgerProps) {
  const { data: payments, isLoading } = usePayments({
    bankAccountId: account?.id,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Libro de Banco: {account?.name} ({account?.currency?.code})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right text-green-600">
                    Ingreso
                  </TableHead>
                  <TableHead className="text-right text-red-600">
                    Egreso
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment: any) => {
                  const isIncome = payment.type === "INCOME";
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-xs">
                        {new Date(payment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.reference || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">
                          {payment.partnerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.methodName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {isIncome ? (
                          <span className="flex items-center justify-end gap-1">
                            {formatCurrency(payment.amount)}
                            <ArrowDownLeft className="h-3 w-3" />
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {!isIncome ? (
                          <span className="flex items-center justify-end gap-1">
                            {formatCurrency(payment.amount)}
                            <ArrowUpRight className="h-3 w-3" />
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!payments || payments.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay movimientos registrados en esta cuenta.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
