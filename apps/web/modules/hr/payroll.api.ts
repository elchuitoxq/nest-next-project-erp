import api from "@/lib/api";

export const payrollApi = {
  getPayrollExcel: async (runId: string) => {
    const { data } = await api.get(
      `/hr/payroll/${runId}/export/excel-download`,
      {
        responseType: "blob",
      },
    );
    return data;
  },
};
