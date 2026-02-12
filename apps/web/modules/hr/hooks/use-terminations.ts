import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface CalculateTerminationParams {
  employeeId: string;
  date: string;
  reason: string;
}

export interface ExecuteTerminationParams extends CalculateTerminationParams {
  notes?: string;
}

export interface TerminationCalculation {
  employee: {
    id: string;
    name: string;
    startDate: string;
    terminationDate: string;
  };
  calculation: {
    tenureYears: string;
    accumulatedBenefits: string;
    vacationPending: {
      days: number;
      amount: string;
    };
    profitSharingPending: {
      days: number;
      amount: string;
    };
    doubleIndemnity: string;
    total: string;
    currency: string;
  };
}

export function useTerminations() {
  const queryClient = useQueryClient();

  const calculateTermination = useMutation({
    mutationFn: async (data: CalculateTerminationParams) => {
      const { data: res } = await api.post("/hr/terminations/calculate", data);
      return res as TerminationCalculation;
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al calcular liquidación",
      );
    },
  });

  const executeTermination = useMutation({
    mutationFn: async (data: ExecuteTerminationParams) => {
      const { data: res } = await api.post("/hr/terminations/execute", data);
      return res;
    },
    onSuccess: () => {
      toast.success("Empleado dado de baja exitosamente");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al procesar baja");
    },
  });

  return { calculateTermination, executeTermination };
}
