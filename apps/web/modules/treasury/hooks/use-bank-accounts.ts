import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  currencyId: string;
  currentBalance: string;
  isActive: boolean;
  currency?: {
    code: string;
    symbol: string;
  };
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data } = await api.get<BankAccount[]>("/treasury/bank-accounts");
      return data;
    },
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BankAccount>) => {
      const { data: result } = await api.post("/treasury/bank-accounts", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

export function useToggleBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/treasury/bank-accounts/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { id: string; data: Partial<BankAccount> }) => {
      const { data } = await api.put(
        `/treasury/bank-accounts/${vars.id}`,
        vars.data,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}
