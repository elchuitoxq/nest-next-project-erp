import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Employee } from "../../hooks/use-employees";
import { PayrollConcept } from "../../concepts/hooks/use-payroll-concepts";

export interface Incident {
  id: string;
  employee: Employee;
  concept: PayrollConcept;
  date: string;
  quantity: string;
  amount: string;
  status: "PENDING" | "PROCESSED";
  notes?: string;
}

export function useIncidents() {
  return useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data } = await api.get("/hr/incidents");
      return data;
    },
  });
}

export function useIncidentMutations() {
  const queryClient = useQueryClient();

  const createIncident = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/hr/incidents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incidencia registrada");
    },
    onError: () => toast.error("Error al registrar incidencia"),
  });

  const deleteIncident = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/hr/incidents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incidencia eliminada");
    },
  });

  return { createIncident, deleteIncident };
}
