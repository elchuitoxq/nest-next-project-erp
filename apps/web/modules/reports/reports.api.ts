import api from "@/lib/api";

export const fiscalReportsApi = {
  getLibroVentas: async (month: string, year: string, branchId?: string) => {
    const { data } = await api.get("/reports/fiscal/libro-ventas", {
      params: { month, year, branchId },
    });
    return data;
  },

  getLibroCompras: async (month: string, year: string, branchId?: string) => {
    const { data } = await api.get("/reports/fiscal/libro-compras", {
      params: { month, year, branchId },
    });
    return data;
  },
};

