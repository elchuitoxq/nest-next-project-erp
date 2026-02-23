import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { ActivityItem, ChartData, KpiData } from "../types";

export function useBiStats(
  dateRange?: { from?: Date; to?: Date },
  options: { enabled?: boolean } = { enabled: true },
) {
  const queryParams = new URLSearchParams();
  if (dateRange?.from)
    queryParams.append("startDate", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.append("endDate", dateRange.to.toISOString());
  const queryString = queryParams.toString();

  const kpis = useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["bi", "kpis", queryString],
    queryFn: async () => {
      const response = await api.get<KpiData>(`/bi/kpis?${queryString}`);
      return response.data;
    },
    enabled: options.enabled,
  });

  const chart = useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["bi", "chart", queryString],
    queryFn: async () => {
      const response = await api.get<ChartData[]>(`/bi/chart?${queryString}`);
      return response.data;
    },
    enabled: options.enabled,
  });

  const activity = useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["bi", "activity"],
    queryFn: async () => {
      const response = await api.get<ActivityItem[]>("/bi/activity");
      return response.data;
    },
    enabled: options.enabled,
  });

  return { kpis, chart, activity };
}
