import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "../types";
import { formatCurrency } from "@/lib/utils";

// ... imports
import { RefreshCw } from "lucide-react";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | undefined;
  onConfirm?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onRecalculate?: (order: Order) => void;
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  onCancel,
  onGenerateInvoice,
  onRecalculate,
}: OrderDetailsDialogProps) {
  if (!order) return null;

  const handleConfirm = () => {
    onConfirm?.(order);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.(order);
    onOpenChange(false);
  };

  const handleGenerateInvoice = () => {
    onGenerateInvoice?.(order);
    onOpenChange(false);
  };

  const handleRecalculate = () => {
    onRecalculate?.(order);
    // Modal closing is handled by parent or we can do it here too if we want immediate feedback
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-blue-600">Confirmado</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-600">Completado</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Detalle del Pedido: {order.code}</DialogTitle>
          <DialogDescription>
            Información completa del pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Fecha</p>
            <p>
              {order.date
                ? format(new Date(order.date), "dd 'de' MMMM, yyyy", {
                    locale: es,
                  })
                : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <div>{getStatusBadge(order.status)}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Tasa de Cambio
            </p>
            <p>
              {order.exchangeRate
                ? `Bs. ${parseFloat(order.exchangeRate.toString()).toFixed(2)}`
                : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
            <p>{order.partner?.name || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Almacén (Origen)
            </p>
            <p>{order.warehouse?.name || "No asignado"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Sucursal
            </p>
            <p>{order.branch?.name || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Creado por
            </p>
            <p>{order.user?.name || "Usuario del sistema"}</p>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.product?.name || "Producto desconocido"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      parseFloat(item.price.toString()).toFixed(2),
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      (
                        parseFloat(item.quantity.toString()) *
                        parseFloat(item.price.toString())
                      ).toFixed(2),
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Total General
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(
                    parseFloat(order.total.toString()).toFixed(2),
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {(order.status === "PENDING" || order.status === "CONFIRMED") &&
            onRecalculate && (
              <Button variant="secondary" onClick={handleRecalculate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalcular
              </Button>
            )}
          {(order.status === "PENDING" || order.status === "CONFIRMED") &&
            onCancel && (
              <Button variant="destructive" onClick={handleCancel}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Pedido
              </Button>
            )}
          {order.status === "CONFIRMED" && onGenerateInvoice && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleGenerateInvoice}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar Factura
            </Button>
          )}
          {order.status === "PENDING" && onConfirm && (
            <Button className="bg-primary" onClick={handleConfirm}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Pedido
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
