import { useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export const useVoidPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/treasury/payments/${id}/void`);
      return response.data;
    },
    onSuccess: (_, id) => {
      // Invalidate relevant queries to force UI refresh
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["statement"] });

      toast.success("El pago fue anulado de forma exitosa.");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Ocurrió un error inesperado al anular el pago",
      );
    },
  });
};
