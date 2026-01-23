import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { CreateBranchValues, UpdateBranchValues } from "../types";
import { toast } from "sonner";

export function useBranchMutations() {
  const queryClient = useQueryClient();

  const createBranch = useMutation({
    mutationFn: async (data: CreateBranchValues) => {
      return await api.post("/branches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sede creada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear sede");
    },
  });

  const updateBranch = useMutation({
    mutationFn: async (data: UpdateBranchValues) => {
      const { id, ...rest } = data;
      return await api.patch(`/branches/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sede actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al actualizar sede");
    },
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sede eliminada (desactivada) exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar sede");
    },
  });

  return { createBranch, updateBranch, deleteBranch };
}
