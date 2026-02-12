import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface PayrollRun {
  id: string;
  code: string;
  branchId: string;
  frequency: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  status: "DRAFT" | "PAID";
  currency: {
    code: string;
    symbol: string;
  };
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    identityCard: string;
    position?: { name: string };
  };
  baseAmount: string;
  bonuses: string;
  deductions: string;
  netTotal: string;
  lines: PayrollItemLine[];
}

export interface PayrollItemLine {
  id: string;
  conceptName: string;
  category: "INCOME" | "DEDUCTION" | "EMPLOYER";
  amount: string;
  rate?: string;
}

export function usePayrollRuns() {
  return useQuery<PayrollRun[]>({
    queryKey: ["payroll-runs"],
    queryFn: async () => {
      const { data } = await api.get("/hr/payroll");
      return data;
    },
  });
}

export function usePayrollRun(id: string) {
  return useQuery<PayrollRun>({
    queryKey: ["payroll-run", id],
    queryFn: async () => {
      const { data } = await api.get(`/hr/payroll/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePayrollMutations() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const generatePayroll = useMutation({
    mutationFn: async (data: {
      startDate: string;
      endDate: string;
      frequency: string;
      description?: string;
    }) => {
      const { data: res } = await api.post("/hr/payroll/generate", data);
      return res;
    },
    onSuccess: (data) => {
      toast.success("Nómina generada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
      router.push(`/dashboard/hr/payroll/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al generar nómina");
    },
  });

  const payPayroll = useMutation({
    mutationFn: async ({
      id,
      bankAccountId,
    }: {
      id: string;
      bankAccountId: string;
    }) => {
      const { data } = await api.post(`/hr/payroll/${id}/pay`, {
        bankAccountId,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Pago procesado correctamente");
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-run"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al procesar pago");
    },
  });

  return { generatePayroll, payPayroll };
}
