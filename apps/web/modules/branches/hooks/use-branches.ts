import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { Branch } from "../types";

export function useBranches() {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get<Branch[]>("/branches");
      return data;
    },
  });
}
