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
import { GuideCard } from "@/components/guide/guide-card";

interface OverviewChartProps {
  data?: ChartData[];
  isLoading: boolean;
}

export function OverviewChart({ data, isLoading }: OverviewChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-xl" />;
  }

  return (
    <Card className="col-span-full lg:col-span-4 premium-shadow">
      <CardHeader>
        <CardTitle>Flujo de Caja</CardTitle>
        <CardDescription>
          Comparativa de Ingresos vs Egresos (Ventas vs Compras).
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <GuideCard
          title="Interpretación del Flujo de Caja"
          variant="info"
          className="mb-4"
        >
          <p>Este gráfico muestra el pulso financiero real:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Barras Verdes (Ventas):</strong> Facturación bruta
              procesada.
            </li>
            <li>
              <strong>Barras Naranjas (Compras):</strong> Gastos operativos y de
              inventario.
            </li>
          </ul>
        </GuideCard>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data || []}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea580c" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0.3} />
              </linearGradient>
            </defs>
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
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--background) / 0.8)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString("es-VE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }
              formatter={(value: any) => [formatCurrency(value), ""]}
            />
            <Bar
              dataKey="income"
              name="Ventas"
              fill="url(#incomeGradient)"
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            />
            <Bar
              dataKey="expense"
              name="Compras"
              fill="url(#expenseGradient)"
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
