import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";

export function useTaxConcepts() {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["tax-concepts"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/tax-concepts");
      return data;
    },
  });
}
