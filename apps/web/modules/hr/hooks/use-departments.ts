import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  branchId: string;
  employeeCount?: number;
  branch?: {
    id: string;
    name: string;
  };
}

export interface CreateDepartmentDto {
  name: string;
  parentId?: string;
  branchId: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  parentId?: string;
  branchId?: string;
}

export function useDepartments(branchId?: string) {
  return useQuery<Department[]>({
    queryKey: ["departments", { branchId }],
    queryFn: async () => {
      const { data } = await api.get("/hr/departments", {
        params: { branchId },
      });
      return data;
    },
  });
}

export function useDepartmentMutations() {
  const queryClient = useQueryClient();

  const createDepartment = useMutation({
    mutationFn: async (data: CreateDepartmentDto) => {
      const { data: res } = await api.post("/hr/departments", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Departamento creado exitosamente");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al crear departamento");
    },
  });

  const updateDepartment = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDepartmentDto;
    }) => {
      const { data: res } = await api.put(`/hr/departments/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Departamento actualizado");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Error al actualizar departamento",
      );
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Departamento eliminado");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Error al eliminar departamento",
      );
    },
  });

  return { createDepartment, updateDepartment, deleteDepartment };
}
