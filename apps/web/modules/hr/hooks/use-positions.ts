import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface JobPosition {
  id: string;
  name: string;
  description?: string;
  currencyId?: string;
  baseSalaryMin?: string;
  baseSalaryMax?: string;
  currency?: {
    symbol: string;
    code: string;
  };
}

export interface CreatePositionValues {
  name: string;
  description?: string;
  currencyId?: string;
  baseSalaryMin?: number;
  baseSalaryMax?: number;
}

export function usePositions() {
  return useQuery({
    queryKey: ["hr-positions"],
    queryFn: async () => {
      const { data } = await api.get<JobPosition[]>("/hr/positions");
      return data;
    },
  });
}

export function usePositionMutations() {
  const queryClient = useQueryClient();

  const createPosition = useMutation({
    mutationFn: async (data: CreatePositionValues) => {
      return await api.post("/hr/positions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-positions"] });
      toast.success("Cargo creado exitosamente");
    },
    onError: () => toast.error("Error al crear cargo"),
  });

  const updatePosition = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreatePositionValues }) => {
      return await api.put(`/hr/positions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-positions"] });
      toast.success("Cargo actualizado exitosamente");
    },
    onError: () => toast.error("Error al actualizar cargo"),
  });

  const deletePosition = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/hr/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-positions"] });
      toast.success("Cargo eliminado");
    },
    onError: () => toast.error("Error al eliminar cargo"),
  });

  return { createPosition, updatePosition, deletePosition };
}
