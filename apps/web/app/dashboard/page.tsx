"use client";

import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StatsCards } from "@/modules/bi/components/stats-cards";
import { OverviewChart } from "@/modules/bi/components/overview-chart";
import { useBiStats } from "@/modules/bi/hooks/use-bi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityFeed } from "@/modules/bi/components/activity-feed";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";

export default function Page() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { kpis, chart, activity } = useBiStats({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 px-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
          </div>
        </div>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-4"
      >
        <PageHeader title="Resumen">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              Periodo:
            </span>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              align="end"
            />
          </div>
        </PageHeader>

        {/* KPI Cards */}
        <StatsCards
          data={kpis.data}
          chartData={chart.data}
          isLoading={kpis.isLoading}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <OverviewChart data={chart.data} isLoading={chart.isLoading} />

          {/* Recent Activity */}
          <ActivityFeed data={activity.data} isLoading={activity.isLoading} />
        </div>
      </motion.div>
    </SidebarInset>
  );
}
