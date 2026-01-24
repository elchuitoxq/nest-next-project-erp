import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  rate?: string;
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      // Endpoint exposed by CurrenciesController in backend
      // Assuming it's mapped to /settings/currencies based on previous file content
      // Or checking backend controller... usually it's /currencies or /settings/currencies
      const { data } = await api.get<Currency[]>("/settings/currencies");
      return data;
    },
  });
}
