import api from "@/lib/api";

export const fiscalReportsApi = {
  getLibroVentas: async (
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
  ) => {
    const { data } = await api.get("/reports/fiscal/libro-ventas", {
      params: { month, year, branchId, fortnight },
    });
    return data;
  },

  getLibroCompras: async (
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
  ) => {
    const { data } = await api.get("/reports/fiscal/libro-compras", {
      params: { month, year, branchId, fortnight },
    });
    return data;
  },
  getFiscalSummary: async (
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
  ) => {
    const { data } = await api.get("/reports/fiscal/summary", {
      params: { month, year, branchId, fortnight },
    });
    return data;
  },

  getRetencionesTxt: async (
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
    direction?: string,
  ) => {
    const { data } = await api.get("/reports/fiscal/retenciones-txt", {
      params: { month, year, branchId, fortnight, direction },
      responseType: "blob", // Important: Receive as Blob
    });
    return data;
  },
  getInvoice: async (id: string) => {
    const { data } = await api.get(`/billing/invoices/${id}`);
    return data;
  },
  getCreditNote: async (id: string) => {
    const { data } = await api.get(`/credit-notes/${id}`);
    return data;
  },
};
