"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, FileSpreadsheet, Loader2, Building2 } from "lucide-react";
import { usePayrollRuns } from "../hooks/use-payroll";
import { PayrollGeneratorDialog } from "../components/payroll/generator-dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { PageHeader } from "@/components/layout/page-header";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export function PayrollDashboard() {
  const router = useRouter();
  const { data: runs, isLoading } = usePayrollRuns();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [search, setSearch] = useState("");

  const formatDate = (date: string) =>
    format(new Date(date), "dd/MM/yyyy", { locale: es });

  const filteredRuns = runs?.filter((run) =>
    run.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Nómina"
          description="Gestión de pagos, recibos y liquidaciones."
        >
          <Button
            onClick={() => setIsGeneratorOpen(true)}
            className="premium-shadow"
          >
            <Plus className="mr-2 h-4 w-4" /> Generar Nómina
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20 premium-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Última Nómina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {runs?.[0]
                  ? formatCurrency(
                      parseFloat(runs[0].totalAmount),
                      runs[0].currency.symbol,
                    )
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {runs?.[0]
                  ? `${formatDate(runs[0].startDate)} - ${formatDate(runs[0].endDate)}`
                  : "Sin datos recientes"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historial de Nóminas</CardTitle>
                <CardDescription>
                  Registro de todas las corridas de nómina generadas.
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border relative">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center backdrop-blur-[2px]"
                  >
                    <div className="bg-background/80 p-3 rounded-full shadow-lg border">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">Código</TableHead>
                    <TableHead className="px-4">Periodo</TableHead>
                    <TableHead className="px-4">Frecuencia</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="text-right px-4">Total</TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (filteredRuns?.length ?? 0) > 0 ? (
                      filteredRuns?.map((run, index) => (
                        <motion.tr
                          key={run.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { delay: index * 0.03 },
                          }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="hover:bg-muted/50 border-b last:border-0 transition-colors group cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/hr/payroll/${run.id}`)
                          }
                        >
                          <TableCell className="font-medium py-3 px-4">
                            {run.code}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {formatDate(run.startDate)} -{" "}
                            {formatDate(run.endDate)}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase font-bold tracking-tighter"
                            >
                              {run.frequency}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge
                              variant={
                                run.status === "PAID" ? "success" : "secondary"
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              {run.status === "PAID" ? "Pagada" : "Borrador"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono-data font-bold text-foreground py-3 px-4 w-[150px]">
                            {formatCurrency(
                              parseFloat(run.totalAmount),
                              run.currency.symbol,
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/hr/payroll/${run.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground italic"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <FileSpreadsheet className="h-8 w-8 opacity-20" />
                            <p>
                              No hay nóminas registradas. Genera la primera.
                            </p>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <PayrollGeneratorDialog
          open={isGeneratorOpen}
          onOpenChange={setIsGeneratorOpen}
        />
      </motion.div>
    </SidebarInset>
  );
}
