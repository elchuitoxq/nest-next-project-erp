import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { fiscalReportsApi } from "../reports.api";
import {
  Loader2,
  FileText,
  Calendar,
  Building2,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface DocumentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  type: "INV" | "NC" | null;
}

export function DocumentDetailModal({
  open,
  onOpenChange,
  documentId,
  type,
}: DocumentDetailModalProps) {
  const { data: document, isLoading } = useQuery({
    queryKey: ["document-detail", type, documentId],
    queryFn: async () => {
      if (!documentId || !type) return null;
      if (type === "INV") return fiscalReportsApi.getInvoice(documentId);
      if (type === "NC") return fiscalReportsApi.getCreditNote(documentId);
      return null;
    },
    enabled: !!documentId && !!type && open,
  });

  const isCreditNote = type === "NC";
  const isReturn = isCreditNote && document?.items && document.items.length > 0;
  const isAdjustment = isCreditNote && !isReturn;

  const colorTheme = isCreditNote ? "red" : "blue";

  // Theme classes helper
  const theme = {
    iconBg: isCreditNote
      ? "bg-red-100 dark:bg-red-900/30"
      : "bg-blue-100 dark:bg-blue-900/30",
    iconColor: isCreditNote
      ? "text-red-600 dark:text-red-400"
      : "text-blue-600 dark:text-blue-400",
    badge: isCreditNote
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", theme.iconBg)}>
                  {isCreditNote ? (
                    <ArrowRightLeft
                      className={cn("h-5 w-5", theme.iconColor)}
                    />
                  ) : (
                    <FileText className={cn("h-5 w-5", theme.iconColor)} />
                  )}
                </div>
                <span>
                  {isCreditNote ? "Nota de Crédito" : "Factura Fiscal"}
                </span>
                {!isLoading && isAdjustment && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold tracking-widest hidden sm:flex"
                  >
                    Ajuste
                  </Badge>
                )}
                {!isLoading && isReturn && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold tracking-widest hidden sm:flex"
                  >
                    Devolución
                  </Badge>
                )}
              </DialogTitle>
            </div>
            {!isLoading && document && (
              <Badge
                variant="outline"
                className="text-sm font-mono tracking-widest px-3 py-1 bg-muted/50"
              >
                {document.code}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs">
            {isCreditNote
              ? "Detalle de la operación de crédito y referencia afectada."
              : "Detalle completo de facturación, items y pagos realizados."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
              <p className="text-sm text-muted-foreground italic font-medium">
                Consultando servidor...
              </p>
            </div>
          ) : !document ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl border-muted">
              <p className="text-muted-foreground">
                No se encontró información para este documento.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-4 px-4 bg-muted/30 rounded-xl border border-dashed">
                <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <Calendar className="size-4" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      Fecha de Emisión
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {format(new Date(document.date), "dd 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <Building2 className="size-4" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      Socio de Negocio
                    </p>
                  </div>
                  <p
                    className="text-sm font-semibold truncate"
                    title={document.partner?.name}
                  >
                    {document.partner?.name || "N/A"}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {document.partner?.taxId}
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <Wallet className="size-4" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      Moneda y Tasa
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold"
                    >
                      {document.currency?.code}
                    </Badge>
                    <span className="text-xs font-mono font-medium">
                      @ {Number(document.exchangeRate).toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    {isCreditNote ? (
                      <ArrowRightLeft className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {isCreditNote ? "Factura Afe." : "Control Interno"}
                    </p>
                  </div>
                  <p className="text-sm font-bold font-mono">
                    {isCreditNote
                      ? document.invoice?.code
                      : document.invoiceNumber || document.code}
                  </p>
                </div>
              </div>

              {/* 2. Content Sections - Unified space-y-6 */}
              <div className="space-y-6">
                {document.items && document.items.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide text-foreground/70">
                      {isReturn
                        ? "📦 Productos Devueltos"
                        : "📋 Items Facturados"}
                      <Badge variant="outline" className="text-[10px] h-5">
                        {document.items.length}
                      </Badge>
                    </h4>
                    <div className="w-full min-w-0">
                      <div className="rounded-xl border shadow-sm overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0">
                            <TableRow className="h-10 hover:bg-transparent">
                              <TableHead className="h-10 text-[10px] uppercase font-bold">
                                Producto
                              </TableHead>
                              <TableHead className="h-10 text-[10px] uppercase font-bold text-right">
                                Cant.
                              </TableHead>
                              <TableHead className="h-10 text-[10px] uppercase font-bold text-right">
                                Precio
                              </TableHead>
                              <TableHead className="h-10 text-[10px] uppercase font-bold text-right">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {document.items.map((item: any) => (
                              <TableRow
                                key={item.id}
                                className="h-12 border-muted/50"
                              >
                                <TableCell className="font-semibold text-xs py-3 max-w-[200px] truncate">
                                  {item.product?.name || "Producto desconocido"}
                                </TableCell>
                                <TableCell className="text-right text-xs py-3 font-mono">
                                  {Number(item.quantity).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-xs py-3 font-mono">
                                  {formatCurrency(item.price)}
                                </TableCell>
                                <TableCell className="text-right text-xs py-3 font-bold font-mono-data">
                                  {formatCurrency(item.total)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Adjustment Message */}
                {isAdjustment && (
                  <div className="p-6 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl flex items-center gap-4">
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                        Saldo a Favor / Ajuste de Cuenta
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 opacity-80">
                        Esta operación es un ajuste directo al saldo sin retorno
                        de mercancía.
                      </p>
                    </div>
                  </div>
                )}

                {!isCreditNote &&
                  document.payments &&
                  document.payments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide text-foreground/70">
                        💳 Pagos Realizados
                        <Badge variant="outline" className="text-[10px] h-5">
                          {document.payments.length}
                        </Badge>
                      </h4>
                      <div className="w-full min-w-0">
                        <div className="rounded-xl border shadow-sm overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                              <TableRow className="h-10 hover:bg-transparent">
                                <TableHead className="h-10 text-[10px] uppercase font-bold">
                                  Fecha
                                </TableHead>
                                <TableHead className="h-10 text-[10px] uppercase font-bold">
                                  Método
                                </TableHead>
                                <TableHead className="h-10 text-[10px] uppercase font-bold hidden sm:table-cell">
                                  Referencia
                                </TableHead>
                                <TableHead className="h-10 text-[10px] uppercase font-bold text-right">
                                  Monto
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {document.payments.map((payment: any) => (
                                <TableRow
                                  key={payment.id}
                                  className="h-12 border-muted/50"
                                >
                                  <TableCell className="text-xs py-3 text-muted-foreground font-medium">
                                    {format(
                                      new Date(payment.date),
                                      "dd/MM/yyyy",
                                    )}
                                  </TableCell>
                                  <TableCell className="font-bold text-xs py-3">
                                    {payment.method?.name || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-xs py-3 font-mono text-muted-foreground hidden sm:table-cell">
                                    {payment.reference || "-"}
                                  </TableCell>
                                  <TableCell className="text-right text-xs py-3 font-black text-green-600 dark:text-green-400 font-mono-data">
                                    {formatCurrency(payment.amount)}{" "}
                                    {document.currency?.symbol}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                {/* 3. Totals - Clean Card Layout */}
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <FileText className="h-24 w-24" />
                  </div>

                  <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-muted-foreground pb-2 border-b border-muted/30">
                    <span>Base Imponible</span>
                    <span className="font-mono-data text-foreground text-sm">
                      {formatCurrency(document.totalBase)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-muted-foreground pb-2 border-b border-muted/30">
                    <span>Impuesto (IVA)</span>
                    <span className="font-mono-data text-foreground text-sm">
                      {formatCurrency(document.totalTax)}
                    </span>
                  </div>
                  {Number(document.totalIgtf) > 0 && (
                    <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-blue-600 pb-2 border-b border-blue-100">
                      <span>IGTF (3%)</span>
                      <span className="font-mono-data text-sm">
                        {formatCurrency(document.totalIgtf)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-1">
                      <span className="text-sm font-black uppercase tracking-tighter text-muted-foreground">
                        Importe Total {isCreditNote ? "NC" : "Factura"}
                      </span>
                      <p className="text-[10px] text-muted-foreground/60 italic font-medium">
                        Valores expresados en {document.currency?.code}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xl sm:text-2xl font-black font-mono-data tracking-tighter drop-shadow-sm",
                        isCreditNote
                          ? "text-red-600 dark:text-red-400"
                          : "text-primary",
                      )}
                    >
                      {formatCurrency(
                        document.total,
                        document.currency?.symbol || "Bs",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer - Standard Padded Footer */}
        <DialogFooter className="mt-6 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-black text-xs uppercase tracking-widest rounded-xl hover:bg-muted transition-all"
          >
            Cerrar Detalle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
