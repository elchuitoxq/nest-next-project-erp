import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export interface Vacation {
  id: string;
  employeeId: string;
  year: number;
  totalDays: number;
  daysTaken: number;
  daysPending: number;
  status: "PENDING" | "TAKEN" | "PAID";
  startDate: string;
  endDate: string;
  returnDate: string;
  amount?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateVacationDto {
  employeeId: string;
  year: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  returnDate: string;
  amount?: number;
  notes?: string;
}

export function useVacations(employeeId: string) {
  return useQuery<Vacation[]>({
    queryKey: ["vacations", employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/hr/vacations/employee/${employeeId}`);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useVacationMutations() {
  const queryClient = useQueryClient();
  const { id: employeeId } = useParams();

  const createVacation = useMutation({
    mutationFn: async (data: CreateVacationDto) => {
      const res = await api.post("/hr/vacations", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Vacaciones registradas correctamente");
      queryClient.invalidateQueries({ queryKey: ["vacations", employeeId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al registrar vacaciones",
      );
    },
  });

  const updateVacation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateVacationDto>;
    }) => {
      const res = await api.patch(`/hr/vacations/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Vacaciones actualizadas correctamente");
      queryClient.invalidateQueries({ queryKey: ["vacations", employeeId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al actualizar vacaciones",
      );
    },
  });

  const deleteVacation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hr/vacations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Vacaciones eliminadas correctamente");
      queryClient.invalidateQueries({ queryKey: ["vacations", employeeId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al eliminar vacaciones",
      );
    },
  });

  return {
    createVacation,
    updateVacation,
    deleteVacation,
  };
}
