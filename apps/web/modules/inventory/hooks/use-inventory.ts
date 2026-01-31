import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Warehouse,
  CreateWarehouseValues,
  CreateInventoryMoveValues,
  Move,
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
        error.response?.data?.message || "Error al actualizar almacén",
      );
    },
  });

  return { createWarehouse, updateWarehouse };
}

// --- MOVES ---
export interface FindMovesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string | string[];
  warehouseId?: string;
}

export function useInventoryMoves(params: FindMovesParams = {}) {
  // Serialize params
  const serializedParams = {
    ...params,
    type: Array.isArray(params.type) ? params.type.join(",") : params.type,
  };

  return useQuery({
    queryKey: ["inventory-moves", serializedParams],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Move[];
        meta: { total: number; page: number; lastPage: number };
      }>("/inventory/moves", {
        params: serializedParams,
      });
      return data;
    },
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
        error.response?.data?.message || "Error al registrar movimiento",
      );
    },
  });

  return { createMove };
}

// --- STOCK ---
export function useStock(warehouseId?: string, search?: string) {
  return useQuery({
    queryKey: ["stock", warehouseId, search],
    queryFn: async () => {
      if (!warehouseId) return [];
      const { data } = await api.get(`/inventory/stock/${warehouseId}`, {
        params: { search },
      });
      return data;
    },
    enabled: !!warehouseId,
  });
}
