import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  branchId?: string;
}

export const useWarehouses = () => {
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get<Warehouse[]>("/inventory/warehouses");
      return res.data;
    },
  });

  return {
    warehouses,
    isLoading,
  };
};
