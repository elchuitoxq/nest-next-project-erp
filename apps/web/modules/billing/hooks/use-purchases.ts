import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Invoice } from "../types";
import { PurchaseFormValues } from "../schemas/purchase.schema";

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>(
        "/billing/invoices?type=PURCHASE",
      );
      return data;
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PurchaseFormValues) => {
      const payload = {
        ...data,
        type: "PURCHASE",
      };
      const { data: response } = await api.post("/billing/invoices", payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      // Invalidate Stock if warehouse was involved
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-moves"] });
    },
  });
}
