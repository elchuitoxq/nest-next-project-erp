"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartData } from "../hooks/use-bi";
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
        <CardTitle>Resumen de Ventas</CardTitle>
        <CardDescription>
          Ventas realizadas en los últimos 7 días.
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
                  weekday: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar
              dataKey="total"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
