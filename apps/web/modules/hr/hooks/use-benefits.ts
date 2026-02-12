import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export interface Benefit {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  monthlySalary: string;
  integralSalary: string;
  days: number;
  amount: string;
  accumulatedAmount: string;
  type: "REGULAR" | "ANTICIPO" | "LIQUIDACION";
  paid: boolean;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateBenefitDto {
  employeeId: string;
  year: number;
  month: number;
  monthlySalary: number;
  integralSalary: number;
  days?: number;
  amount: number;
  type?: "REGULAR" | "ANTICIPO" | "LIQUIDACION";
  notes?: string;
}

export function useBenefits(employeeId: string) {
  return useQuery<Benefit[]>({
    queryKey: ["benefits", employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/hr/benefits/employee/${employeeId}`);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useBenefitMutations() {
  const queryClient = useQueryClient();
  const { id: employeeId } = useParams();

  const createBenefit = useMutation({
    mutationFn: async (data: CreateBenefitDto) => {
      const res = await api.post("/hr/benefits", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Prestación registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["benefits", employeeId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al registrar prestación",
      );
    },
  });

  const updateBenefit = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateBenefitDto>;
    }) => {
      const res = await api.patch(`/hr/benefits/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Prestación actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: ["benefits", employeeId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al actualizar prestación",
      );
    },
  });

  const deleteBenefit = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hr/benefits/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Prestación eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["benefits", employeeId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al eliminar prestación",
      );
    },
  });

  return {
    createBenefit,
    updateBenefit,
    deleteBenefit,
  };
}
