import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export enum ContractType {
  INDEFINIDO = "INDEFINIDO",
  DETERMINADO = "DETERMINADO",
  OBRA = "OBRA",
}

export enum ContractStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
}

export interface Contract {
  id: string;
  employeeId: string;
  type: ContractType;
  startDate: string;
  endDate?: string;
  trialPeriodEnd?: string;
  weeklyHours?: number;
  notes?: string;
  status: ContractStatus;
}

export interface CreateContractDto {
  employeeId: string;
  type: ContractType;
  startDate: string;
  endDate?: string;
  trialPeriodEnd?: string;
  weeklyHours?: number;
  notes?: string;
}

export interface UpdateContractDto {
  type?: ContractType;
  startDate?: string;
  endDate?: string;
  trialPeriodEnd?: string;
  weeklyHours?: number;
  notes?: string;
  status?: ContractStatus;
}

export function useContracts(employeeId: string) {
  return useQuery<Contract[]>({
    queryKey: ["contracts", { employeeId }],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await api.get(`/hr/contracts/employee/${employeeId}`);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useContractMutations() {
  const queryClient = useQueryClient();

  const createContract = useMutation({
    mutationFn: async (data: CreateContractDto) => {
      const { data: res } = await api.post("/hr/contracts", data);
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contracts", { employeeId: variables.employeeId }],
      });
      toast.success("Contrato registrado exitosamente");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al crear contrato");
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateContractDto;
    }) => {
      const { data: res } = await api.put(`/hr/contracts/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contrato actualizado");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Error al actualizar contrato",
      );
    },
  });

  const terminateContract = useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate: string }) => {
      const { data: res } = await api.patch(`/hr/contracts/${id}/terminate`, {
        endDate,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contrato terminado");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al terminar contrato");
    },
  });

  return { createContract, updateContract, terminateContract };
}
