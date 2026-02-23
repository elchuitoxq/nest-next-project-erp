import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";

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
  const { token } = useAuthStore();

  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<ExchangeRate[]>(
        "/settings/currencies/rates/latest",
      );
      return data;
    },
    // Refresh every minute to keep it relatively fresh without overloading
    refetchInterval: 60 * 1000,
    // Only run if we have a token (prevents 401 loop on login page or if token invalid)
    enabled: !!token,
    retry: false, // Don't retry if it fails (likely auth or network)
  });
};
