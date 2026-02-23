"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { StatsCards } from "@/modules/bi/components/stats-cards";
import { OverviewChart } from "@/modules/bi/components/overview-chart";
import { useBiStats } from "@/modules/bi/hooks/use-bi";
import { ActivityFeed } from "@/modules/bi/components/activity-feed";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";
import { NAV_ITEMS } from "@/lib/navigation";
import { PageHeader } from "@/components/layout/page-header";

export function DashboardView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const DASHBOARD_PERMISSIONS = [
    "dashboard:view",
    "finance:view",
    "operations:view",
    "hr:view",
  ];

  const canViewDashboard =
    !user || user.permissions?.some((p) => DASHBOARD_PERMISSIONS.includes(p));

  const { kpis, chart, activity } = useBiStats(
    {
      from: dateRange?.from,
      to: dateRange?.to,
    },
    { enabled: !!user && canViewDashboard },
  );

  useEffect(() => {
    if (!user) return;

    if (!canViewDashboard) {
      setTimeout(() => setIsRedirecting(true), 0);
      const findFirstRoute = () => {
        for (const item of NAV_ITEMS) {
          if (item.url === "/dashboard") continue;

          const itemHasPermission =
            !item.permissions?.length ||
            item.permissions.some((p) => user.permissions.includes(p));

          let hasVisibleChildren = false;
          let firstVisibleChildUrl = null;

          if (item.items?.length) {
            for (const sub of item.items) {
              const subAccess =
                !sub.permissions?.length ||
                sub.permissions.some((p) => user.permissions.includes(p));
              if (subAccess) {
                hasVisibleChildren = true;
                if (!firstVisibleChildUrl) firstVisibleChildUrl = sub.url;
              }
            }
          }

          if (itemHasPermission) {
            return firstVisibleChildUrl || item.url;
          }

          if (hasVisibleChildren && firstVisibleChildUrl) {
            return firstVisibleChildUrl;
          }
        }
        return null;
      };

      const target = findFirstRoute();
      if (target) {
        router.replace(target);
      } else {
        setTimeout(() => setIsRedirecting(false), 0);
      }
    }
  }, [user, router, canViewDashboard]);

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center p-8">
        Redirigiendo...
      </div>
    );
  }

  return (
    <SidebarInset>
      <AppHeader />
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

        <StatsCards
          data={kpis.data}
          chartData={chart.data}
          isLoading={kpis.isLoading}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <OverviewChart data={chart.data} isLoading={chart.isLoading} />
          <ActivityFeed data={activity.data} isLoading={activity.isLoading} />
        </div>
      </motion.div>
    </SidebarInset>
  );
}
