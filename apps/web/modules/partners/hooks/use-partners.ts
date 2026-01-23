import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Partner } from "../types";
import { PartnerFormValues } from "../schemas/partner.schema";
import { toast } from "sonner";

export const usePartners = (params?: { search?: string; type?: string }) => {
  return useQuery({
    queryKey: ["partners", params?.search, params?.type],
    queryFn: async () => {
      const { data } = await api.get<Partner[]>("/partners", {
        params,
      });
      return data;
    },
  });
};

export const usePartner = (id: string) => {
  return useQuery({
    queryKey: ["partners", id],
    queryFn: async () => {
      const { data } = await api.get<Partner>(`/partners/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const usePartnerMutations = () => {
  const queryClient = useQueryClient();

  const createPartner = useMutation({
    mutationFn: async (data: PartnerFormValues) => {
      const { data: result } = await api.post("/partners", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Socio creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear socio");
    },
  });

  const updatePartner = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PartnerFormValues;
    }) => {
      const { data: result } = await api.put(`/partners/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Socio actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al actualizar socio");
    },
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      const { data: result } = await api.delete(`/partners/${id}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Socio eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar socio");
    },
  });

  return {
    createPartner,
    updatePartner,
    deletePartner,
  };
};
