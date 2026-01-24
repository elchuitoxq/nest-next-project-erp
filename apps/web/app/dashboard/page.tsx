"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">ERP</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Resumen</h2>
          <div className="flex items-center space-x-2">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              align="end"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <StatsCards data={kpis.data} isLoading={kpis.isLoading} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <OverviewChart data={chart.data} isLoading={chart.isLoading} />

          {/* Recent Activity */}
          <ActivityFeed data={activity.data} isLoading={activity.isLoading} />
        </div>
      </div>
    </SidebarInset>
  );
}
