import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Invoice } from "../types";

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>("/billing/invoices");
      return data;
    },
  });
}

export function usePostInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/billing/invoices/${id}/post`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      returnStock,
      warehouseId,
    }: {
      id: string;
      returnStock: boolean;
      warehouseId?: string;
    }) => {
      const { data } = await api.post(`/billing/invoices/${id}/void`, {
        returnStock,
        warehouseId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-moves"] });
    },
  });
}
