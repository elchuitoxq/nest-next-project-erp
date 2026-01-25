"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartData } from "../types";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewChartProps {
  data?: ChartData[];
  isLoading: boolean;
}

export function OverviewChart({ data, isLoading }: OverviewChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-xl" />;
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Flujo de Caja</CardTitle>
        <CardDescription>
          Comparativa de Ingresos vs Egresos.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data || []}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("es-VE", {
                  day: "numeric",
                  month: "short",
                });
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString("es-VE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })}
              formatter={(value: any) => [formatCurrency(value), ""]}
            />
            <Bar
              dataKey="income"
              name="Ventas"
              fill="#0d9488" // Teal-600
              radius={[4, 4, 0, 0]}
            />
             <Bar
              dataKey="expense"
              name="Compras"
              fill="#ea580c" // Orange-600
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
