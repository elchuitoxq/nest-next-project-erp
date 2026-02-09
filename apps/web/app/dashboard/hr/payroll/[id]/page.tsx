"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { useParams } from "next/navigation";
import {
  usePayroll,
  usePayrollMutations,
} from "@/modules/hr/hooks/use-payroll";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, CheckCircle, Lock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function PayrollDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: payroll, isLoading } = usePayroll(id);
  const { updateStatus } = usePayrollMutations();
  const [filter, setFilter] = useState("ALL"); // ALL, CASH, BANK_X

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!payroll) return <div>No encontrada</div>;

  // Filter Logic
  const filteredItems = payroll.items?.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "CASH") return item.employee.paymentMethod === "CASH";
    // Filter by specific bank
    return item.employee.bankId === filter;
  });

  const uniqueBanks = Array.from(
    new Set(
      payroll.items
        ?.filter(
          (i) =>
            i.employee.paymentMethod === "BANK_TRANSFER" && i.employee.bankId,
        )
        .map((i) => JSON.stringify(i.employee.bank)), // Store full object string to dedup
    ),
  ).map((s) => JSON.parse(s as string));

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id, status });
  };

  const handleExport = async () => {
    if (!filteredItems || filteredItems.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const sheetName =
      filter === "ALL"
        ? "Nómina Completa"
        : filter === "CASH"
          ? "Pago en Efectivo"
          : "Pago Bancario";
    const worksheet = workbook.addWorksheet(sheetName);

    // Define Columns
    worksheet.columns = [
      { header: "Empleado", key: "name", width: 30 },
      { header: "Cédula", key: "identity", width: 15 },
      { header: "Método", key: "method", width: 15 },
      { header: "Banco", key: "bank", width: 20 },
      { header: "Cuenta", key: "account", width: 25 },
      { header: "Base", key: "base", width: 15 },
      { header: "Bonos", key: "bonuses", width: 15 },
      { header: "Deducciones", key: "deductions", width: 15 },
      { header: "Neto a Pagar", key: "net", width: 15 },
    ];

    // Style Header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add Data
    filteredItems.forEach((item) => {
      worksheet.addRow({
        name: `${item.employee.firstName} ${item.employee.lastName}`,
        identity: item.employee.identityCard,
        method:
          item.employee.paymentMethod === "CASH" ? "Efectivo" : "Transferencia",
        bank: item.employee.bank?.name || "-",
        account: item.employee.accountNumber || "-",
        base: Number(item.baseAmount),
        bonuses: Number(item.bonuses),
        deductions: Number(item.deductions),
        net: Number(item.netTotal),
      });
    });

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Nomina_${payroll.code}_${filter === "ALL" ? "General" : filter}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb customLabels={{ [id]: payroll.code }} />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header Actions */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {payroll.code}
              <Badge variant="outline">{payroll.status}</Badge>
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(payroll.startDate), "dd MMM", { locale: es })} -{" "}
              {format(new Date(payroll.endDate), "dd MMM yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex gap-2">
            {payroll.status === "DRAFT" && (
              <Button onClick={() => handleStatusChange("PUBLISHED")}>
                <Lock className="mr-2 h-4 w-4" /> Publicar
              </Button>
            )}
            {payroll.status === "PUBLISHED" && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange("PAID")}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Marcar Pagada
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <Card className="premium-shadow">
          <CardHeader>
            <CardTitle>Detalle de Empleados</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Desglose de pagos por empleado en esta nómina.
              </CardDescription>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los empleados</SelectItem>
                    <SelectItem value="CASH">Solo Efectivo</SelectItem>
                    {uniqueBanks.map((bank: any) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        Banco: {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Banco / Cuenta</TableHead>
                  <TableHead className="text-right">Sueldo Base</TableHead>
                  <TableHead className="text-right">Cestaticket</TableHead>
                  <TableHead className="text-right font-bold">
                    Total Neto
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.employee.firstName} {item.employee.lastName}
                    </TableCell>
                    <TableCell>{item.employee.identityCard}</TableCell>
                    <TableCell>
                      {item.employee.paymentMethod === "CASH" ? (
                        <Badge variant="secondary">Efectivo</Badge>
                      ) : (
                        <Badge variant="info">Transferencia</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.employee.paymentMethod === "CASH" ? (
                        "-"
                      ) : (
                        <>
                          <div className="font-medium text-foreground">
                            {item.employee.bank?.name}
                          </div>
                          {item.employee.accountNumber}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.baseAmount, payroll.currency?.code)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.bonuses, payroll.currency?.code)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(item.netTotal, payroll.currency?.code)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay empleados en este filtro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
