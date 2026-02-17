import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AuditLog } from "../types/audit";

export const useAuditHistory = (entityTable: string, entityId: string) => {
  return useQuery<AuditLog[]>({
    queryKey: ["audit-history", entityTable, entityId],
    queryFn: async () => {
      if (!entityId || !entityTable) return [];
      const response = await api.get(`/audit/${entityTable}/${entityId}`);
      return response.data;
    },
    enabled: !!entityId && !!entityTable,
  });
};
