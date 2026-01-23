import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export const useCreditNotes = () => {
  const queryClient = useQueryClient();

  const createCreditNote = useMutation({
    mutationFn: async (data: {
      invoiceId: string;
      items: { productId: string; quantity: number }[];
      warehouseId?: string;
    }) => {
      const res = await api.post("/credit-notes", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Nota de Crédito creada correctamente");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al crear nota de crédito",
      );
    },
  });

  return {
    createCreditNote,
  };
};
