import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Order, CreateOrderValues } from "../types";
import { toast } from "sonner";

export interface FindOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string | string[];
  status?: string | string[];
}

export function useOrders(params: FindOrdersParams = {}) {
  // Convert arrays to comma-separated strings for URL params
  const serializedParams = {
    ...params,
    type: Array.isArray(params.type) ? params.type.join(",") : params.type,
    status: Array.isArray(params.status)
      ? params.status.join(",")
      : params.status,
  };

  return useQuery({
    queryKey: ["orders", serializedParams],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Order[];
        meta: { total: number; page: number; lastPage: number };
      }>("/orders", {
        params: serializedParams,
      });
      return data;
    },
  });
}

export const useOrderStats = (type: "SALE" | "PURCHASE") => {
  return useQuery({
    queryKey: ["orders", "stats", type],
    queryFn: async () => {
      const { data } = await api.get<{ status: string; count: number }[]>(
        `/orders/stats?type=${type}`,
      );
      return data;
    },
  });
};

export function useOrderMutations() {
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderValues) => {
      return await api.post("/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear pedido");
    },
  });

  const confirmOrder = useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/orders/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-moves"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] }); // Update stock view
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Update product lists
      toast.success("Pedido confirmado. Inventario descontado.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al confirmar pedido");
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/orders/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-moves"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Pedido cancelado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al cancelar pedido");
    },
  });

  const generateInvoice = useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/orders/${id}/invoice`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura generada y pedido completado.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al generar factura");
    },
  });

  const recalculateOrder = useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/orders/${id}/recalculate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido recalculado con la tasa actual.");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al recalcular pedido",
      );
    },
  });

  return {
    createOrder,
    confirmOrder,
    cancelOrder,
    generateInvoice,
    recalculateOrder,
  };
}
