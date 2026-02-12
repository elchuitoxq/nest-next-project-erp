import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface PayrollSetting {
  id: string;
  key: string;
  label: string;
  value: number;
  type: "FIXED_USD" | "FIXED_VES" | "PERCENTAGE";
}

export interface PayrollConceptType {
  id: string;
  code: string;
  name: string;
  category: "INCOME" | "DEDUCTION" | "EMPLOYER";
  isSystem: boolean;
}

export function usePayrollSettings() {
  return useQuery<Record<string, PayrollSetting>>({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
      const { data } = await api.get("/hr/settings");
      return data;
    },
  });
}

export function usePayrollConceptTypes() {
  return useQuery<PayrollConceptType[]>({
    queryKey: ["payroll-concept-types"],
    queryFn: async () => {
      const { data } = await api.get("/hr/settings/concepts");
      return data;
    },
  });
}

export function usePayrollSettingsMutation() {
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<PayrollSetting>[]) => {
      const { data } = await api.patch("/hr/settings", { settings });
      return data;
    },
    onSuccess: () => {
      toast.success("Configuraciones actualizadas");
      queryClient.invalidateQueries({ queryKey: ["payroll-settings"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al actualizar configuraciones",
      );
    },
  });

  return { updateSettings };
}
