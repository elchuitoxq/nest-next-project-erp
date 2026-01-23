import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Branch } from "../types";

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get<Branch[]>("/branches");
      return data;
    },
  });
}
