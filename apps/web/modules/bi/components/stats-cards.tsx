import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { KpiData, ChartData } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface StatsCardsProps {
  data?: KpiData;
  chartData?: ChartData[];
  isLoading: boolean;
}

export function StatsCards({ data, chartData, isLoading }: StatsCardsProps) {
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
      <Link href="/dashboard/operations/sales">
        <Card className="hover:bg-muted/50 transition-all duration-300 cursor-pointer h-full premium-shadow border-t-4 border-t-teal-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Totales
            </CardTitle>
            <DollarSign className="text-teal-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono-data">
                  {formatCurrency(data.totalSales)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Ingresos del periodo
                </p>
              </div>
              <div className="h-10 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData?.slice(-7)}>
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/operations/purchases">
        <Card className="hover:bg-muted/50 transition-all duration-300 cursor-pointer h-full premium-shadow border-t-4 border-t-orange-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Totales
            </CardTitle>
            <ShoppingCart className="text-orange-600 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono-data">
                  {formatCurrency(data.totalPurchases)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Compras registradas
                </p>
              </div>
              <div className="h-10 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData?.slice(-7)}>
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#ea580c"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/billing/invoices">
        <Card className="hover:bg-muted/50 transition-all duration-300 cursor-pointer h-full premium-shadow border-t-4 border-t-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cuentas por Cobrar
            </CardTitle>
            <Users className="text-blue-600 h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono-data">
              {formatCurrency(data.accountsReceivable)}
            </div>
            <p className="text-muted-foreground text-xs">
              Facturas pendientes de pago
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/inventory/products">
        <Card className="hover:bg-muted/50 transition-all duration-300 cursor-pointer h-full premium-shadow border-t-4 border-t-purple-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Inventario
            </CardTitle>
            <Package className="text-purple-600 h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono-data">
              {formatCurrency(data.inventoryValue)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data.activeProducts} productos activos
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
