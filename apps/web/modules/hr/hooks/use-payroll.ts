import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Employee } from "./use-employees";

export interface PayrollItem {
  id: string;
  employeeId: string;
  employee: Employee;
  baseAmount: string;
  bonuses: string;
  deductions: string;
  netTotal: string;
}

export interface PayrollRun {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  frequency: string;
  totalAmount: string;
  status: "DRAFT" | "PUBLISHED" | "PAID";
  items?: PayrollItem[];
  currency?: {
    symbol: string;
    code: string;
  };
}

export function usePayrolls() {
  return useQuery<PayrollRun[]>({
    queryKey: ["payrolls"],
    queryFn: async () => {
      const { data } = await api.get("/hr/payroll");
      return data;
    },
  });
}

export function usePayroll(id: string) {
  return useQuery<PayrollRun>({
    queryKey: ["payroll", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/hr/payroll/${id}`);
      return data;
    },
  });
}

export function usePayrollMutations() {
  const queryClient = useQueryClient();

  const generatePayroll = useMutation({
    mutationFn: async (data: {
      startDate: string;
      endDate: string;
      frequency: string;
    }) => {
      return await api.post("/hr/payroll/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      toast.success("Nómina generada exitosamente");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al generar nómina");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.patch(`/hr/payroll/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll", variables.id] });
      toast.success("Estado actualizado");
    },
  });

  return { generatePayroll, updateStatus };
}
