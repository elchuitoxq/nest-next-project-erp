import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  RefreshCw,
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
                ? order.currency?.code === "USD"
                  ? `1 USD = Bs ${parseFloat(order.exchangeRate.toString()).toFixed(2)}`
                  : `Ref: 1 USD = Bs ${parseFloat(order.exchangeRate.toString()).toFixed(2)}`
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
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.product?.sku || "-"}
                  </TableCell>
                  <TableCell>
                    {item.product?.name || "Producto desconocido"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
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

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>

          {/* Print Button */}
          <PDFDownloadLink
            document={<OrderPdf order={order} type={type} />}
            fileName={`Pedido-${order.code}.pdf`}
          >
            {/* @ts-ignore */}
            {({ loading }) => (
              <Button variant="outline" disabled={loading}>
                <Printer className="mr-2 h-4 w-4" />
                {loading ? "Generando..." : "Imprimir"}
              </Button>
            )}
          </PDFDownloadLink>

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
            <div className="flex flex-col items-end gap-1">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleGenerateInvoice}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Factura Fiscal
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Se emitirá en {order.currency?.code || "Bolívares (VES)"}
              </span>
            </div>
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
