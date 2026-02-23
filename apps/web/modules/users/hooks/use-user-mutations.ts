import { useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { CreateUserValues, UpdateUserValues } from "../types";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

export function useUserMutations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario creado exitosamente");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Error al crear usuario");
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      return await api.patch(`/users/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado exitosamente");
    },
    onError: (error: ApiError) => {
      toast.error(
        error.response?.data?.message || "Error al actualizar usuario",
      );
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Error al eliminar usuario");
    },
  });

  return { createUser, updateUser, deleteUser };
}
