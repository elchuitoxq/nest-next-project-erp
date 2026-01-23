import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Warehouse,
  CreateWarehouseValues,
  CreateInventoryMoveValues,
} from "../types";
import { toast } from "sonner";

// --- WAREHOUSES ---
export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data } = await api.get<Warehouse[]>("/inventory/warehouses");
      return data;
    },
  });
}

export function useWarehouseMutations() {
  const queryClient = useQueryClient();

  const createWarehouse = useMutation({
    mutationFn: async (data: CreateWarehouseValues) => {
      return await api.post("/inventory/warehouses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Almacén creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear almacén");
    },
  });

  const updateWarehouse = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateWarehouseValues>;
    }) => {
      return await api.patch(`/inventory/warehouses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Almacén actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al actualizar almacén"
      );
    },
  });

  return { createWarehouse, updateWarehouse };
}

// --- MOVES ---
export function useInventoryMoves() {
  // TODO: Add pagination or filtering
  return useQuery({
    queryKey: ["inventory-moves"],
    queryFn: async () => {
      // Needed backend endpoint for listing moves if not exists
      const { data } = await api.get("/inventory/moves");
      return data;
    },
    retry: false, // Don't retry if 404 (endpoint might not exist yet)
  });
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const createMove = useMutation({
    mutationFn: async (data: CreateInventoryMoveValues) => {
      return await api.post("/inventory/moves", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-moves"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Stock might change
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Movimiento registrado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al registrar movimiento"
      );
    },
  });

  return { createMove };
}

// --- STOCK ---
export function useStock(warehouseId?: string) {
  return useQuery({
    queryKey: ["stock", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const { data } = await api.get(`/inventory/stock/${warehouseId}`);
      return data;
    },
    enabled: !!warehouseId,
  });
}
