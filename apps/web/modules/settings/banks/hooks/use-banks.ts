import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Bank {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data } = await api.get("/settings/banks");
      return data;
    },
  });
}

export function useBankMutations() {
  const queryClient = useQueryClient();

  const createBank = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      const { data: result } = await api.post("/settings/banks", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Banco creado exitosamente");
    },
    onError: () => toast.error("Error al crear banco"),
  });

  const updateBank = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; code?: string };
    }) => {
      const { data: result } = await api.put(`/settings/banks/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Banco actualizado exitosamente");
    },
    onError: () => toast.error("Error al actualizar banco"),
  });

  const toggleBank = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/settings/banks/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Estado del banco actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  return { createBank, updateBank, toggleBank };
}
