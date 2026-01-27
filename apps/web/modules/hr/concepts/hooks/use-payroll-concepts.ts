import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface PayrollConcept {
  id: string;
  code: string;
  name: string;
  category: "INCOME" | "DEDUCTION";
  isSystem: boolean;
}

export function usePayrollConcepts() {
  return useQuery<PayrollConcept[]>({
    queryKey: ["payroll-concepts"],
    queryFn: async () => {
      const { data } = await api.get("/hr/concepts");
      return data;
    },
  });
}

export function usePayrollConceptMutations() {
  const queryClient = useQueryClient();

  const createConcept = useMutation({
    mutationFn: async (data: { name: string; code: string; category: string }) => {
      return await api.post("/hr/concepts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-concepts"] });
      toast.success("Concepto creado");
    },
    onError: () => toast.error("Error al crear concepto"),
  });

  const deleteConcept = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/hr/concepts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-concepts"] });
      toast.success("Concepto eliminado");
    },
  });

  return { createConcept, deleteConcept };
}
