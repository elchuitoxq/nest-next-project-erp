// Re-export specific hooks if needed or standard hooks
// Fixed barrel export

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaymentMethod, CreatePaymentDto } from "../types";

export const usePaymentMethods = () => {
  return useQuery<PaymentMethod[]>({
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
    queryKey: ["payments", filters], // Include filters in key
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.bankAccountId)
        params.append("bankAccountId", filters.bankAccountId);

      const { data } = await api.get<any>(
        `/treasury/payments?${params.toString()}`,
      );
      return data;
    },
  });
};

export const useAccountStatement = (
  partnerId: string,
  reportingCurrencyId?: string,
) => {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["account-statement", partnerId, reportingCurrencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (reportingCurrencyId)
        params.append("reportingCurrencyId", reportingCurrencyId);

      const { data } = await api.get<any>(
        `/treasury/statements/${partnerId}?${params.toString()}`,
      );
      return data;
    },
    enabled: !!partnerId,
  });
};

export const useDailyClose = (date: string) => {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["daily-close", date],
    queryFn: async () => {
      const { data } = await api.get<any>(`/treasury/daily-close?date=${date}`);
      return data;
    },
  });
};

export const useAvailableCreditNotes = (
  partnerId?: string,
  currencyId?: string,
) => {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["available-credit-notes", partnerId, currencyId],
    queryFn: async () => {
      if (!partnerId || !currencyId) return [];
      const { data } = await api.get<any[]>(
        `/treasury/available-credit-notes?partnerId=${partnerId}&currencyId=${currencyId}`,
      );
      return data; // formatted as Array of CreditNotes with `remainingAmount`
    },
    enabled: !!partnerId && !!currencyId,
  });
};
