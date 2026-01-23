import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface KpiData {
  totalSales: number;
  accountsReceivable: number;
  inventoryValue: number;
  pendingOrders: number;
  activeProducts: number;
}

export interface ChartData {
  date: string;
  total: number;
}

export function useBiStats() {
  const kpis = useQuery({
    queryKey: ["bi", "kpis"],
    queryFn: async () => {
      const response = await api.get<KpiData>("/bi/kpis");
      return response.data;
    },
  });

  const chart = useQuery({
    queryKey: ["bi", "chart"],
    queryFn: async () => {
      const response = await api.get<ChartData[]>("/bi/chart");
      return response.data;
    },
  });

  return { kpis, chart };
}
