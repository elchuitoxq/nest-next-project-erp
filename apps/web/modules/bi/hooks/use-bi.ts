import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ActivityItem, ChartData, KpiData } from "../types";

export function useBiStats(dateRange?: { from?: Date; to?: Date }) {
  const queryParams = new URLSearchParams();
  if (dateRange?.from)
    queryParams.append("startDate", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.append("endDate", dateRange.to.toISOString());
  const queryString = queryParams.toString();

  const kpis = useQuery({
    queryKey: ["bi", "kpis", queryString],
    queryFn: async () => {
      const response = await api.get<KpiData>(`/bi/kpis?${queryString}`);
      return response.data;
    },
  });

  const chart = useQuery({
    queryKey: ["bi", "chart", queryString],
    queryFn: async () => {
      const response = await api.get<ChartData[]>(`/bi/chart?${queryString}`);
      return response.data;
    },
  });

  const activity = useQuery({
    queryKey: ["bi", "activity"],
    queryFn: async () => {
      const response = await api.get<ActivityItem[]>("/bi/activity");
      return response.data;
    },
  });

  return { kpis, chart, activity };
}
