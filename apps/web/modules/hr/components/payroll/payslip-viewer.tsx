"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface PayslipData {
  payrollRun: {
    code: string;
    frequency: string;
    startDate: string;
    endDate: string;
    currency: { code: string; symbol: string };
  };
  employee: {
    fullName: string;
    identityCard: string;
    position: string;
    department: string;
    branch: string;
    bankName: string;
    accountNumber: string;
  };
  incomeLines: LineItem[];
  deductionLines: LineItem[];
  employerLines?: LineItem[];
  totals: {
    baseAmount: string;
    bonuses: string;
    deductions: string;
    netTotal: string;
  };
}

interface LineItem {
  concept: string;
  code: string;
  amount: string;
  rate?: string;
  base?: string;
}

export function PayslipViewer({
  runId,
  itemId,
}: {
  runId: string;
  itemId: string;
}) {
  const { data, isLoading } = useQuery<PayslipData>({
    queryKey: ["payslip", runId, itemId],
    queryFn: async () => {
      const { data } = await api.get(`/hr/payroll/${runId}/payslip/${itemId}`);
      return data;
    },
    enabled: !!runId && !!itemId,
  });

  const handlePrint = () => {
    const content = document.getElementById("payslip-content");
    if (!content) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Recibo de Pago</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
          body { font-family: sans-serif; font-size: 12px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .border-b { border-bottom: 1px solid #ccc; }
          .border-t { border-top: 1px solid #ccc; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .pb-4 { padding-bottom: 1rem; }
          .pt-4 { padding-top: 1rem; }
          .pt-2 { padding-top: 0.5rem; }
          .p-4 { padding: 1rem; }
          .p-8 { padding: 2rem; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          .flex { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 2px solid black; padding: 0.5rem 0; }
          td { padding: 0.25rem 0; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .text-gray-500 { color: #6b7280; }
          .text-emerald-600 { color: #059669; }
          .text-rose-600 { color: #e11d48; }
          .rounded { border-radius: 0.25rem; }
          .w-1/3 { width: 33%; }
          .mt-12 { margin-top: 3rem; }
      `);
    printWindow.document.write("</style></head><body>");
    printWindow.document.write(content.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

  if (!data) return <span>No data</span>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recibo de Pago</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>

        <div
          id="payslip-content"
          className="p-8 bg-white text-black text-sm border shadow-sm print:shadow-none print:border-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold uppercase">
                {data.employee.branch || "Empresa"}
              </h2>
              <p className="text-gray-500">RIF: J-00000000-0</p>
              <p>{data.employee.branch}</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold">RECIBO DE PAGO</h3>
              <p className="font-mono">{data.payrollRun.code}</p>
              <p>
                Desde:{" "}
                {format(new Date(data.payrollRun.startDate), "dd/MM/yyyy")}{" "}
                <br />
                Hasta: {format(new Date(data.payrollRun.endDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-gray-50 p-4 rounded">
            <div>
              <p>
                <span className="font-bold">Trabajador:</span>{" "}
                {data.employee.fullName}
              </p>
              <p>
                <span className="font-bold">Cédula:</span>{" "}
                {data.employee.identityCard}
              </p>
              <p>
                <span className="font-bold">Cargo:</span>{" "}
                {data.employee.position}
              </p>
            </div>
            <div>
              <p>
                <span className="font-bold">Departamento:</span>{" "}
                {data.employee.department}
              </p>
              <p>
                <span className="font-bold">Banco:</span>{" "}
                {data.employee.bankName}
              </p>
              <p>
                <span className="font-bold">Cuenta:</span>{" "}
                {data.employee.accountNumber}
              </p>
            </div>
          </div>

          {/* Concepts Table */}
          <table className="w-full mb-6">
            <thead className="border-b-2 border-black">
              <tr>
                <th className="text-left py-2">Concepto</th>
                <th className="text-right py-2">Asignaciones</th>
                <th className="text-right py-2">Deducciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Income */}
              {data.incomeLines.map((line, i) => (
                <tr key={`inc-${i}`}>
                  <td className="py-1">
                    {line.concept}
                    {line.rate && Number(line.rate) > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({Number(line.rate) * 100}%)
                      </span>
                    )}
                  </td>
                  <td className="text-right py-1">
                    {formatCurrency(line.amount, data.payrollRun.currency.code)}
                  </td>
                  <td className="text-right py-1"></td>
                </tr>
              ))}
              {/* Deductions */}
              {data.deductionLines.map((line, i) => (
                <tr key={`ded-${i}`}>
                  <td className="py-1">
                    {line.concept}
                    {line.rate && Number(line.rate) > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({Number(line.rate) * 100}%)
                      </span>
                    )}
                  </td>
                  <td className="text-right py-1"></td>
                  <td className="text-right py-1">
                    {formatCurrency(line.amount, data.payrollRun.currency.code)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-black font-bold">
              <tr>
                <td className="py-2 text-right">TOTALES</td>
                <td className="text-right py-2 text-emerald-600">
                  {formatCurrency(
                    (
                      Number(data.totals.baseAmount) +
                      Number(data.totals.bonuses)
                    ).toString(),
                    data.payrollRun.currency.code,
                  )}
                </td>
                <td className="text-right py-2 text-rose-600">
                  {formatCurrency(
                    data.totals.deductions,
                    data.payrollRun.currency.code,
                  )}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-600">NETO A PAGAR</p>
              <p className="text-2xl font-bold bg-gray-100 px-4 py-1 rounded">
                {formatCurrency(
                  data.totals.netTotal,
                  data.payrollRun.currency.code,
                )}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-dashed flex justify-between text-xs text-center text-gray-500">
            <div className="w-1/3 border-t border-black pt-2">
              Firma del Empleado
            </div>
            <div className="w-1/3 border-t border-black pt-2">
              Firma del Patrono
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
