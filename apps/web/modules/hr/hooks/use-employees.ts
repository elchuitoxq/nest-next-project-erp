import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { JobPosition } from "./use-positions";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  identityCard: string;
  email?: string;
  phone?: string;
  positionId: string;
  position?: JobPosition;
  salaryCurrencyId?: string;
  baseSalary: string;
  payFrequency: string;
  status: string;
  salaryCurrency?: {
    symbol: string;
    code: string;
  };
  paymentMethod?: "BANK_TRANSFER" | "CASH" | "MOBILE_PAYMENT";
  bankId?: string;
  bank?: {
    id: string;
    name: string;
    code: string;
  };
  // Deprecated: bankName
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
}

export interface CreateEmployeeValues {
  firstName: string;
  lastName: string;
  identityCard: string;
  email?: string;
  phone?: string;
  positionId: string;
  salaryCurrencyId?: string;
  baseSalary: number;
  payFrequency?: string;
  paymentMethod?: string;
  bankId?: string;
  accountNumber?: string;
  accountType?: string;
}

export function useEmployees(status?: string) {
  return useQuery({
    queryKey: ["hr-employees", status],
    queryFn: async () => {
      const { data } = await api.get<Employee[]>("/hr/employees", {
        params: { status },
      });
      return data;
    },
  });
}

export function useEmployeeMutations() {
  const queryClient = useQueryClient();

  const createEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeValues) => {
      return await api.post("/hr/employees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      toast.success("Empleado registrado exitosamente");
    },
    onError: () => toast.error("Error al registrar empleado"),
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateEmployeeValues }) => {
      return await api.put(`/hr/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      toast.success("Empleado actualizado exitosamente");
    },
    onError: () => toast.error("Error al actualizar empleado"),
  });

  return { createEmployee, updateEmployee };
}
