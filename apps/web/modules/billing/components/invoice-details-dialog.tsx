import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Invoice } from "../types";
import { PaymentDialog } from "@/modules/treasury/components/payment-dialog";
import { formatCurrency } from "@/lib/utils";
import { useVoidInvoice, usePostInvoice } from "../hooks/use-invoices";
import { useWarehouses } from "@/modules/inventory/hooks/use-inventory";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CreateCreditNoteDialog } from "./create-credit-note-dialog";

interface InvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | undefined;
}

export function InvoiceDetailsDialog({
  open,
  onOpenChange,
  invoice,
}: InvoiceDetailsDialogProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Void Dialog State
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [isCreditNoteDialogOpen, setIsCreditNoteDialogOpen] = useState(false);
  const [returnStock, setReturnStock] = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState("");

  const { mutate: voidInvoice, isPending: isVoiding } = useVoidInvoice();
  const { mutate: postInvoice, isPending: isPosting } = usePostInvoice();
  const { data: warehouses } = useWarehouses();

  if (!invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Borrador</Badge>;
      case "POSTED":
        return <Badge className="bg-blue-600">Publicado</Badge>;
      case "PARTIALLY_PAID":
        return <Badge className="bg-yellow-600">Abonado</Badge>;
      case "PAID":
        return <Badge className="bg-green-600">Pagado</Badge>;
      case "VOID":
        return <Badge variant="destructive">Anulado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleVoid = () => {
    if (returnStock && !targetWarehouseId) {
      toast.error("Por favor seleccione un almacén para devolver el stock");
      return;
    }

    voidInvoice(
      {
        id: invoice.id,
        returnStock,
        warehouseId: targetWarehouseId,
      },
      {
        onSuccess: () => {
          toast.success("Factura anulada correctamente");
          setIsVoidDialogOpen(false);
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          toast.error(
            error.response?.data?.message || "Error al anular factura",
          );
        },
      },
    );
  };

  const handlePost = () => {
    postInvoice(invoice.id, {
      onSuccess: () => {
        toast.success("Factura emitida correctamente");
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || "Error al emitir factura");
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Factura {invoice.code}
              {getStatusBadge(invoice.status)}
            </DialogTitle>
            <DialogDescription>Detalle de la factura.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p>
                {invoice.date
                  ? format(new Date(invoice.date), "dd 'de' MMMM, yyyy", {
                      locale: es,
                    })
                  : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Estado
              </p>
              <div>{getStatusBadge(invoice.status)}</div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Cliente
              </p>
              <p>{invoice.partner?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Moneda
              </p>
              <p>{invoice.currency?.code || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Tasa de Cambio
              </p>
              <p>
                {invoice.exchangeRate
                  ? `Bs. ${parseFloat(invoice.exchangeRate.toString()).toFixed(2)}`
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Sucursal
              </p>
              <p>{invoice.branch?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Creado por
              </p>
              <p>{invoice.user?.name || "Usuario del sistema"}</p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <div className="bg-muted p-3 rounded-md min-w-[200px] text-right">
              <p className="text-sm font-medium text-muted-foreground">
                Saldo Pendiente
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(
                  Math.max(
                    0,
                    Number(invoice.total) -
                      (invoice.payments?.reduce(
                        (acc, curr) => acc + Number(curr.amount),
                        0,
                      ) || 0),
                  ),
                )}
              </p>
            </div>
          </div>

          {/* Items Table */}
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
                {invoice.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.product?.name || "Producto desconocido"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Base Imponible
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.totalBase)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    IVA
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.totalTax)}
                  </TableCell>
                </TableRow>
                {parseFloat(invoice.totalIgtf.toString()) > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      IGTF (3%)
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.totalIgtf)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-right font-bold text-lg"
                  >
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Payments History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="font-semibold text-sm">Historial de Pagos</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {format(new Date(p.date), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{p.method?.name || "-"}</TableCell>
                        <TableCell>{p.reference || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 mt-4">
            {invoice.status === "DRAFT" && (
              <Button onClick={handlePost} disabled={isPosting}>
                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Emitir Factura
              </Button>
            )}

            {(invoice.status === "POSTED" || invoice.status === "PAID") && (
              <>
                {invoice.creditNotes && invoice.creditNotes.length > 0 ? (
                  <Button
                    variant="outline"
                    disabled
                    className="text-muted-foreground"
                  >
                    Devuelto ({invoice.creditNotes[0].code})
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsCreditNoteDialogOpen(true)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                  >
                    Devolución / N.C.
                  </Button>
                )}
              </>
            )}

            {invoice.status !== "VOID" && invoice.status !== "PAID" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setReturnStock(false);
                  setTargetWarehouseId("");
                  setIsVoidDialogOpen(true);
                }}
              >
                Anular Factura
              </Button>
            )}

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>

            {invoice.status !== "PAID" &&
              invoice.status !== "VOID" &&
              invoice.status !== "DRAFT" && (
                <Button onClick={() => setIsPaymentOpen(true)}>
                  Registrar Pago
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        invoice={invoice}
      />

      {/* Confirmation Dialog for Voiding */}
      <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Anulación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas anular esta factura? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-2 border p-4 rounded-md">
              <Checkbox
                id="returnStock"
                checked={returnStock}
                onCheckedChange={(checked) => setReturnStock(checked === true)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="returnStock" className="font-medium">
                  Devolver mercancía al inventario
                </Label>
                <p className="text-sm text-muted-foreground">
                  Si se activa, se creará un movimiento de entrada
                  ("Devolución").
                </p>
              </div>
            </div>

            {returnStock && (
              <div className="space-y-2">
                <Label>Almacén de destino</Label>
                <Select
                  value={targetWarehouseId}
                  onValueChange={setTargetWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVoidDialogOpen(false)}
              disabled={isVoiding}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={isVoiding}
            >
              {isVoiding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invoice && (
        <CreateCreditNoteDialog
          invoice={invoice}
          open={isCreditNoteDialogOpen}
          onOpenChange={setIsCreditNoteDialogOpen}
        />
      )}
    </>
  );
}
