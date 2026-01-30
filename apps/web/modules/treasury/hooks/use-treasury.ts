// Re-export specific hooks if needed or standard hooks
export * from "./use-bank-accounts"; // Exporting here for consolidation

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaymentMethod, CreatePaymentDto } from "../types";

export const usePaymentMethods = () => {
  return useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await api.get<PaymentMethod[]>("/treasury/methods");
      return data;
    },
  });
};

export const useRegisterPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: CreatePaymentDto) => {
      const { data } = await api.post("/treasury/payments", paymentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["account-statement"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
};

export const usePayments = (filters?: { bankAccountId?: string }) => {
  return useQuery({
    queryKey: ["payments", filters], // Include filters in key
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.bankAccountId) params.append("bankAccountId", filters.bankAccountId);
      
      const { data } = await api.get(`/treasury/payments?${params.toString()}`);
      return data;
    },
  });
};

export const useAccountStatement = (partnerId: string) => {
  return useQuery({
    queryKey: ["account-statement", partnerId],
    queryFn: async () => {
      const { data } = await api.get(`/treasury/statements/${partnerId}`);
      return data;
    },
    enabled: !!partnerId,
  });
};

export const useDailyClose = (date: string) => {
  return useQuery({
    queryKey: ["daily-close", date],
    queryFn: async () => {
      const { data } = await api.get(`/treasury/daily-close?date=${date}`);
      return data;
    },
  });
};
