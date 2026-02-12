"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { payrollApi } from "../../payroll.api";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, CreditCard } from "lucide-react";
import { usePayrollRun, usePayrollMutations } from "../../hooks/use-payroll";
import { useBanks } from "@/modules/settings/banks/hooks/use-banks";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PayslipViewer } from "../payroll/payslip-viewer";
import api from "@/lib/api";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { PageHeader } from "@/components/layout/page-header";
import { motion } from "framer-motion";

interface PayrollDetailViewProps {
  id: string;
}

export function PayrollDetailView({ id }: PayrollDetailViewProps) {
  const router = useRouter();
  const { data: run, isLoading } = usePayrollRun(id);
  const { payPayroll } = usePayrollMutations();
  const { data: banks } = useBanks();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  if (isLoading) {
    return (
      <SidebarInset>
        <AppHeader
          customLabels={{ hr: "RRHH", payroll: "Nómina", [id]: "Detalle" }}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Cargando detalles...</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (!run) {
    return (
      <SidebarInset>
        <AppHeader
          customLabels={{ hr: "RRHH", payroll: "Nómina", [id]: "Error" }}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Nómina no encontrada
            </h2>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </div>
        </div>
      </SidebarInset>
    );
  }

  const handlePay = () => {
    if (!selectedBankId) {
      toast.error("Selecciona una cuenta bancaria para debitar el pago");
      return;
    }
    payPayroll.mutate(
      { id, bankAccountId: selectedBankId },
      {
        onSuccess: () => setIsConfirmOpen(false),
      },
    );
  };

  const formatDate = (date: string) =>
    format(new Date(date), "dd/MM/yyyy", { locale: es });

  return (
    <SidebarInset>
      <AppHeader
        customLabels={{ hr: "RRHH", payroll: "Nómina", [id]: run.code }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-1 flex-col gap-6 p-6 pt-0"
      >
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <span>Nómina {run.code}</span>
              <Badge variant={run.status === "PAID" ? "success" : "secondary"}>
                {run.status === "PAID" ? "PAGADA" : "BORRADOR"}
              </Badge>
            </div>
          }
          description={`Periodo: ${formatDate(run.startDate)} - ${formatDate(run.endDate)} • ${run.frequency}`}
        >
          <div className="flex gap-2">
            {run.status === "PAID" && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `${api.defaults.baseURL}/hr/payroll/${id}/export/txt`,
                    "_blank",
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" /> TXT Banco
              </Button>
            )}

            {(run.status === "PAID" || run.status === "DRAFT") && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const blob = await payrollApi.getPayrollExcel(id);
                    saveAs(blob, `nomina-${run.code}.xlsx`);
                  } catch (error) {
                    toast.error("Error al descargar el archivo Excel");
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Excel Detallado
              </Button>
            )}
            {run.status === "DRAFT" && (
              <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <CreditCard className="mr-2 h-4 w-4" /> Procesar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Pago de Nómina</DialogTitle>
                    <DialogDescription>
                      Se debitará el monto total de la cuenta seleccionada y se
                      registrará el asiento contable.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                      <span className="font-medium">Total a Pagar</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(
                          parseFloat(run.totalAmount),
                          run.currency.symbol,
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label>Cuenta Bancaria (Origen)</Label>
                      <Select onValueChange={setSelectedBankId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar banco..." />
                        </SelectTrigger>
                        <SelectContent>
                          {banks?.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsConfirmOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handlePay} disabled={payPayroll.isPending}>
                      {payPayroll.isPending
                        ? "Procesando..."
                        : "Confirmar Pago"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="premium-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  parseFloat(run.totalAmount),
                  run.currency.symbol,
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="premium-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{run.items?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="premium-shadow border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Detalle por Empleado</CardTitle>
            <CardDescription>
              Desglose de asignaciones y deducciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Asignaciones</TableHead>
                  <TableHead className="text-right">Deducciones</TableHead>
                  <TableHead className="text-right">Neto a Pagar</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.items?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {item.employee.firstName} {item.employee.lastName}
                    </TableCell>
                    <TableCell>{item.employee.identityCard}</TableCell>
                    <TableCell>{item.employee.position?.name || "-"}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {formatCurrency(
                        parseFloat(item.baseAmount) + parseFloat(item.bonuses),
                        run.currency.symbol,
                      )}
                    </TableCell>
                    <TableCell className="text-right text-rose-500 font-medium">
                      {formatCurrency(
                        parseFloat(item.deductions),
                        run.currency.symbol,
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold w-[150px]">
                      {formatCurrency(
                        parseFloat(item.netTotal),
                        run.currency.symbol,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {run.status === "PAID" && (
                        <PayslipViewer runId={id} itemId={item.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </SidebarInset>
  );
}
