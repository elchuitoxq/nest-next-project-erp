import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { KpiData } from "../hooks/use-bi";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  data?: KpiData;
  isLoading: boolean;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ventas Totales (Mes)
          </CardTitle>
          <DollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.totalSales)}
          </div>
          <p className="text-muted-foreground text-xs">
            +20.1% desde el mes pasado
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cuentas por Cobrar
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.accountsReceivable)}
          </div>
          <p className="text-muted-foreground text-xs">
            Facturas pendientes de pago
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valor Inventario
          </CardTitle>
          <Package className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.inventoryValue)}
          </div>
          <p className="text-muted-foreground text-xs">
            {data.activeProducts} productos activos
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pedidos Pendientes
          </CardTitle>
          <ShoppingCart className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.pendingOrders}</div>
          <p className="text-muted-foreground text-xs">
            Requieren atención inmediata
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
