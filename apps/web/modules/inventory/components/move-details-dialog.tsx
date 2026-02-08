import {
  Dialog,
  DialogContent,
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { DualCurrencyDisplay } from "./dual-currency-display";

interface MoveDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  move?: any; // We'll type this properly in a moment
}

export function MoveDetailsDialog({
  open,
  onOpenChange,
  move,
}: MoveDetailsDialogProps) {
  if (!move) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Movimiento: {move.code}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Fecha:</span>{" "}
              {move.date
                ? format(new Date(move.date), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })
                : "-"}
            </div>
            <div>
              <span className="font-semibold">Tipo:</span> {move.type}
            </div>
            {move.fromWarehouse && (
              <div>
                <span className="font-semibold">Origen:</span>{" "}
                {move.fromWarehouse.name}
              </div>
            )}
            {move.toWarehouse && (
              <div>
                <span className="font-semibold">Destino:</span>{" "}
                {move.toWarehouse.name}
              </div>
            )}
            <div>
              <span className="font-semibold">Responsable:</span>{" "}
              {move.user?.name || "-"}
            </div>
          </div>

          <div className="rounded-md border mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {move.lines?.map((line: any) => {
                  const cost = Number(line.cost || 0);
                  const qty = Number(line.quantity || 0);
                  const total = cost * qty;
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-xs">
                        {line.product?.sku || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {line.product?.name || "Producto desconocido"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {line.quantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {cost > 0 ? (
                          <DualCurrencyDisplay
                            value={cost}
                            currencyId={line.product?.currencyId}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {cost > 0 ? (
                          <DualCurrencyDisplay
                            value={total}
                            currencyId={line.product?.currencyId}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!move.lines?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No hay productos en este movimiento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
