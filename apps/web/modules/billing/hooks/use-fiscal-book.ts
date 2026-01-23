import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface FiscalBookRow {
  date: string;
  type: "FAC" | "NC" | "ND";
  number: string;
  controlNumber: string;
  partnerName: string;
  partnerTaxId: string;
  totalExempt: number;
  totalTaxable: number;
  taxRate: number;
  taxAmount: number;
  retentionAmount: number;
  total: number;
}

export const useFiscalBook = (
  month: number,
  year: number,
  type: "SALE" | "PURCHASE" = "SALE",
) => {
  return useQuery<FiscalBookRow[]>({
    queryKey: ["fiscal-book", month, year, type],
    queryFn: async () => {
      const { data } = await api.get(`/billing/fiscal-book`, {
        params: { month, year, type },
      });
      return data;
    },
  });
};
