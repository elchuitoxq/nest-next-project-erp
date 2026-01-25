import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useTaxConcepts() {
  return useQuery({
    queryKey: ["tax-concepts"],
    queryFn: async () => {
      const { data } = await api.get("/settings/tax-concepts");
      return data;
    },
  });
}
