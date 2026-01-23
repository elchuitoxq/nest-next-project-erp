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
import { Activity } from "lucide-react";

export default function Page() {
  const { kpis, chart } = useBiStats();

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
        </div>

        {/* KPI Cards */}
        <StatsCards data={kpis.data} isLoading={kpis.isLoading} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <OverviewChart data={chart.data} isLoading={chart.isLoading} />

          {/* Recent Activity / Secondary Card */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas operaciones registradas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Activity className="h-8 w-8 opacity-50" />
                  <p>Próximamente: Feed de actividad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
