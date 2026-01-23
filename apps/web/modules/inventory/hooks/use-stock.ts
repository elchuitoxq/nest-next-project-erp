import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface StockItem {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    price: string;
    cost: string;
    currencyId: string | null;
  };
}

export const useWarehouseStock = (
  warehouseId: string | undefined,
  search?: string,
) => {
  return useQuery({
    queryKey: ["stock", warehouseId, search],
    queryFn: async () => {
      if (!warehouseId) return [];
      const response = await api.get<StockItem[]>(
        `/inventory/stock/${warehouseId}`,
        {
          params: { search },
        },
      );
      return response.data;
    },
    enabled: !!warehouseId,
  });
};
