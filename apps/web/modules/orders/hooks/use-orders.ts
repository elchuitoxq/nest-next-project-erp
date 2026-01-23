import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Order, CreateOrderValues } from "../types";
import { toast } from "sonner";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get<Order[]>("/orders");
      return data;
    },
  });
}

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
      // Invalidate invoices queries if we had them
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
