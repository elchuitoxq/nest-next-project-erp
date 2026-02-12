import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export interface ProfitSharing {
  id: string;
  employeeId: string;
  year: number;
  daysToPay: number;
  amount: string;
  paymentDate?: string;
  status: "PENDING" | "PAID";
  notes?: string;
  createdAt: string;
}

export interface CreateProfitSharingDto {
  employeeId: string;
  year: number;
  daysToPay: number;
  amount: number;
  paymentDate?: string;
  status?: "PENDING" | "PAID";
  notes?: string;
}

export function useProfitSharing(employeeId: string) {
  return useQuery<ProfitSharing[]>({
    queryKey: ["profit-sharing", employeeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/hr/profit-sharing/employee/${employeeId}`,
      );
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useProfitSharingMutations() {
  const queryClient = useQueryClient();
  const { id: employeeId } = useParams();

  const createProfitSharing = useMutation({
    mutationFn: async (data: CreateProfitSharingDto) => {
      const res = await api.post("/hr/profit-sharing", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Utilidades registradas correctamente");
      queryClient.invalidateQueries({
        queryKey: ["profit-sharing", employeeId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al registrar utilidades",
      );
    },
  });

  return {
    createProfitSharing,
  };
}
