import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { PayrollConceptType } from "./use-payroll-settings";

export interface Incident {
  id: string;
  employeeId: string;
  conceptId: string;
  date: string; // ISO Date
  quantity: string;
  amount?: string;
  status: "PENDING" | "PROCESSED" | "CANCELLED";
  notes?: string;
  concept?: PayrollConceptType;
  // employee relation might be added if fetching global list
}

export function useIncidents(employeeId?: string) {
  return useQuery<Incident[]>({
    queryKey: ["incidents", employeeId],
    queryFn: async () => {
      const { data } = await api.get("/hr/incidents", {
        params: { employeeId },
      });
      return data;
    },
  });
}

export function useIncidentsMutation(employeeId?: string) {
  const queryClient = useQueryClient();

  const createIncident = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post("/hr/incidents", data);
      return res;
    },
    onSuccess: () => {
      toast.success("Incidencia registrada");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al registrar incidencia",
      );
    },
  });

  const deleteIncident = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/incidents/${id}`);
    },
    onSuccess: () => {
      toast.success("Incidencia eliminada");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  return { createIncident, deleteIncident };
}
