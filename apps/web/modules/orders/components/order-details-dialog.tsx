import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  RefreshCw,
  ShoppingCart,
  Calendar,
  User,
  Globe,
  Store,
  Box,
} from "lucide-react";
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
import { PDFDownloadLink } from "@react-pdf/renderer";
import { OrderPdf } from "@/modules/common/components/pdf/order-pdf";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | undefined;
  type?: "SALE" | "PURCHASE";
  onConfirm?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onRecalculate?: (order: Order) => void;
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  type = "SALE",
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

  const currencyCode = order.currency?.code || "VES";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="size-5" />
              </div>
              Pedido {order.code}
            </DialogTitle>
            <div className="flex gap-2">{getStatusBadge(order.status)}</div>
          </div>
          <DialogDescription>
            Información detallada del pedido y sus renglones.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 px-4 bg-muted/30 rounded-xl border border-dashed mb-4 mt-2">
          <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Calendar className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Fecha
              </p>
            </div>
            <p className="text-sm font-semibold">
              {order.date
                ? format(new Date(order.date), "dd 'de' MMMM, yyyy", {
                    locale: es,
                  })
                : "-"}
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <User className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Tercero
              </p>
            </div>
            <p
              className="text-sm font-semibold truncate"
              title={order.partner?.name || "N/A"}
            >
              {order.partner?.name || "N/A"}
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Box className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Almacén Origin
              </p>
            </div>
            <p className="text-sm font-semibold truncate">
              {order.warehouse?.name || "No asignado"}
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Store className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Sucursal
              </p>
            </div>
            <p className="text-sm font-semibold truncate">
              {order.branch?.name || "N/A"}
            </p>
          </div>
        </div>

        <div className="rounded-md border w-full min-w-0 block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Precio
                </TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs hidden sm:table-cell">
                    {item.product?.sku || "-"}
                  </TableCell>
                  <TableCell>
                    {item.product?.name || "Producto desconocido"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {formatCurrency(
                      parseFloat(item.price.toString()).toFixed(2),
                      currencyCode,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      (
                        parseFloat(item.quantity.toString()) *
                        parseFloat(item.price.toString())
                      ).toFixed(2),
                      currencyCode,
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">
                  Total General
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(
                    parseFloat(order.total.toString()).toFixed(2),
                    currencyCode,
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 border-t pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8"
          >
            Cerrar
          </Button>

          {/* Print Button */}
          <PDFDownloadLink
            document={<OrderPdf order={order} type={type} />}
            fileName={`Pedido-${order.code}.pdf`}
            className="w-full sm:w-auto"
          >
            {/* @ts-ignore */}
            {({ loading }) => (
              <Button
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto px-8"
              >
                <Printer className="mr-2 h-4 w-4" />
                {loading ? "Generando..." : "Imprimir"}
              </Button>
            )}
          </PDFDownloadLink>

          {(order.status === "PENDING" || order.status === "CONFIRMED") &&
            onRecalculate && (
              <Button
                variant="secondary"
                onClick={handleRecalculate}
                className="w-full sm:w-auto px-8"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalcular
              </Button>
            )}
          {(order.status === "PENDING" || order.status === "CONFIRMED") &&
            onCancel && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="w-full sm:w-auto px-8"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Pedido
              </Button>
            )}
          {order.status === "CONFIRMED" && onGenerateInvoice && (
            <div className="flex flex-col items-stretch sm:items-end gap-1 w-full sm:w-auto">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto px-8"
                onClick={handleGenerateInvoice}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Factura Fiscal
              </Button>
              <span className="text-[10px] text-muted-foreground text-center sm:text-right">
                Se emitirá en {order.currency?.code || "Bolívares (VES)"}
              </span>
            </div>
          )}
          {order.status === "PENDING" && onConfirm && (
            <Button
              className="bg-primary w-full sm:w-auto px-8"
              onClick={handleConfirm}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Pedido
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
