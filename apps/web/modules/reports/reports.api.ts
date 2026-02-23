import api from "@/lib/api";

export const fiscalReportsApi = {
  getLibroVentas: async (
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
  ) => {
    const { data } = await api.get<any>("/reports/fiscal/libro-ventas", {
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
    const { data } = await api.get<any>("/reports/fiscal/libro-compras", {
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
    const { data } = await api.get<any>("/reports/fiscal/summary", {
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
    const { data } = await api.get<Blob>("/reports/fiscal/retenciones-txt", {
      params: { month, year, branchId, fortnight, direction },
      responseType: "blob", // Important: Receive as Blob
    });
    return data;
  },

  getRetencionesXml: async (
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
  ) => {
    const { data } = await api.get<Blob>("/reports/fiscal/retenciones-xml", {
      params: { month, year, branchId, fortnight },
      responseType: "blob",
    });
    return data;
  },
  getInvoice: async (id: string) => {
    const { data } = await api.get<any>(`/billing/invoices/${id}`);
    return data;
  },
  getCreditNote: async (id: string) => {
    const { data } = await api.get<any>(`/credit-notes/${id}`);
    return data;
  },
  getFiscalBookExcel: async (
    type: "ventas" | "compras",
    month: string,
    year: string,
    branchId?: string,
    fortnight?: string,
  ) => {
    const { data } = await api.get<Blob>(
      `/reports/fiscal/${type}/export/excel`,
      {
        params: { month, year, branchId, fortnight },
        responseType: "blob",
      },
    );
    return data;
  },
};
