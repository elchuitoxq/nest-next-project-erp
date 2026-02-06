import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ExchangeRate {
  id: string;
  currencyId: string;
  rate: string;
  date: string;
  source: string;
  currency?: {
    code: string;
    symbol: string;
  };
}

export const useExchangeRate = () => {
  return useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<ExchangeRate[]>(
        "/settings/currencies/rates/latest",
      );
      return data;
    },
    // Refresh every minute to keep it relatively fresh without overloading
    refetchInterval: 60 * 1000,
  });
};
