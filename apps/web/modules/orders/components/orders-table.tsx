import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "../types";
import { MoreHorizontal, Eye, CheckCircle2, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";

interface OrdersTableProps {
  orders: Order[];
  onViewDetails?: (order: Order) => void;
  onConfirm?: (order: Order) => void;
  onCancel?: (order: Order) => void;
}

export function OrdersTable({
  orders,
  onViewDetails,
  onConfirm,
  onCancel,
}: OrdersTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Almacén</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                {order.date
                  ? format(new Date(order.date), "dd/MM/yyyy", { locale: es })
                  : "-"}
              </TableCell>
              <TableCell className="font-medium">{order.code}</TableCell>
              <TableCell>
                {order.partner?.name || "Cliente Desconocido"}
              </TableCell>
              <TableCell>{order.branch?.name || "-"}</TableCell>
              <TableCell>{order.warehouse?.name || "-"}</TableCell>
              <TableCell>
                {formatCurrency(parseFloat(order.total.toString()).toFixed(2))}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDetails?.(order)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!orders.length && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-8 text-muted-foreground"
              >
                No hay pedidos registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
