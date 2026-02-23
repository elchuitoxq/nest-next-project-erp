import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DualCurrencyDisplay } from "./dual-currency-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentHistory } from "@/modules/common/components/document-history";
import {
  Box,
  History as HistoryIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PermissionsGate } from "@/components/auth/permissions-gate";
import { PERMISSIONS } from "@repo/db/permissions";
import { useInventoryMutations } from "@/modules/inventory/hooks/use-inventory";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MoveDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  move?: any;
  onStatusChange?: () => void; // Callback to refresh parent after approve/reject
}

export function MoveDetailsDialog({
  open,
  onOpenChange,
  move,
  onStatusChange,
}: MoveDetailsDialogProps) {
  const { approveMove, rejectMove } = useInventoryMutations();

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="warning">Pendiente de Aprobación</Badge>;
      case "APPROVED":
        return <Badge variant="success">Aprobado</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    if (!move) return;
    approveMove.mutate(move.id, {
      onSuccess: () => {
        onStatusChange?.();
        onOpenChange(false);
      },
    });
  };

  const handleReject = () => {
    if (!move) return;
    const reason = window.prompt("¿Motivo del rechazo?");
    if (!reason?.trim()) return;
    rejectMove.mutate(
      { id: move.id, reason },
      {
        onSuccess: () => {
          onStatusChange?.();
          onOpenChange(false);
        },
      },
    );
  };

  if (!move) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[85vh] p-0">
        <ScrollArea className="max-h-[85vh] w-full">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle>Detalles del Movimiento: {move.code}</DialogTitle>
                {getStatusBadge(move.status)}
              </div>
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

              <Tabs defaultValue="items" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger
                    value="items"
                    className="flex items-center gap-2"
                  >
                    <Box className="h-4 w-4" />
                    Renglones del Movimiento
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-2"
                  >
                    <HistoryIcon className="h-4 w-4" />
                    Historial y Proceso
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">
                            Costo Unit.
                          </TableHead>
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
                </TabsContent>

                <TabsContent
                  value="history"
                  className="border rounded-xl p-4 bg-muted/20"
                >
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                      <HistoryIcon className="h-4 w-4 text-primary" />
                      Trazabilidad del Documento
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Línea de tiempo de acciones y cambios del movimiento.
                    </p>
                  </div>
                  <DocumentHistory
                    entityTable="inventory_moves"
                    entityId={move.id}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter className="flex justify-between mt-4 pt-4 border-t">
              <div className="flex gap-2">
                {move.status === "DRAFT" && (
                  <PermissionsGate
                    permission={PERMISSIONS.INVENTORY.MOVES.APPROVE}
                  >
                    <Button
                      variant="default"
                      onClick={handleApprove}
                      disabled={approveMove.isPending || rejectMove.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {approveMove.isPending ? "Aprobando..." : "Aprobar"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={approveMove.isPending || rejectMove.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {rejectMove.isPending ? "Rechazando..." : "Rechazar"}
                    </Button>
                  </PermissionsGate>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto px-8"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
