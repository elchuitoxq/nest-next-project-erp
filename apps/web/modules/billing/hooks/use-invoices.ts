import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Invoice } from "../types";

export interface FindInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string | string[]; // Allow array
  status?: string | string[]; // Allow array
  partnerId?: string;
}

export function useInvoices(params: FindInvoicesParams = {}) {
  // Convert arrays to comma-separated strings for URL params
  const serializedParams = {
    ...params,
    type: Array.isArray(params.type) ? params.type.join(",") : params.type,
    status: Array.isArray(params.status) ? params.status.join(",") : params.status,
  };

  return useQuery({
    queryKey: ["invoices", serializedParams],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Invoice[];
        meta: { total: number; page: number; lastPage: number };
      }>("/billing/invoices", {
        params: serializedParams,
      });
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

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.post(`/billing/invoices/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
