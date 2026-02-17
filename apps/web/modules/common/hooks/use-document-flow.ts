import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface DocumentNode {
  id: string;
  label: string;
  type: string;
  subLabel: string;
  date: string;
  amount: string;
}

export interface DocumentLink {
  source: string;
  target: string;
  type: string;
}

export interface FlowData {
  nodes: DocumentNode[];
  links: DocumentLink[];
}

export const useDocumentFlow = (documentId: string) => {
  return useQuery<FlowData>({
    queryKey: ["document-flow", documentId],
    queryFn: async () => {
      if (!documentId) return { nodes: [], links: [] };
      const { data } = await api.get<FlowData>(`/documents/${documentId}/flow`);
      return data;
    },
    enabled: !!documentId,
  });
};
