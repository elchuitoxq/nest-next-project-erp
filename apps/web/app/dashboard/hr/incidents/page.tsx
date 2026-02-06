"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { motion, AnimatePresence } from "framer-motion";
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
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  useIncidents,
  useIncidentMutations,
} from "@/modules/hr/incidents/hooks/use-incidents";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { IncidentDialog } from "@/modules/hr/incidents/components/incident-dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GuideCard } from "@/components/guide/guide-card";

export default function PayrollIncidentsPage() {
  const { data: incidents, isLoading } = useIncidents();
  const { deleteIncident } = useIncidentMutations();
  const [open, setOpen] = useState(false);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb />
        </div>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Registro de Novedades"
          description="Faltas, horas extra, bonos y deducciones."
        >
          <Button
            onClick={() => setOpen(true)}
            className="gap-2 premium-shadow"
          >
            <Plus className="h-4 w-4" /> Registrar Novedad
          </Button>
        </PageHeader>

        <GuideCard
          title="Gestión de Novedades (Incidencias)"
          variant="info"
          className="mb-4"
        >
          <p>
            Registro de eventos ocasionales que afectan el pago de nómina del
            periodo en curso.
          </p>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>
              <strong>Ingresos (+):</strong> Bonificaciones, comisiones, horas
              extras, reintegros.
            </li>
            <li>
              <strong>Deducciones (-):</strong> Faltas injustificadas,
              préstamos, anticipos, sanciones.
            </li>
          </ul>
        </GuideCard>

        <Card className="border premium-shadow">
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
            <CardDescription>
              Seguimiento de incidencias de nómina del periodo actual.
            </CardDescription>
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
                    <TableHead className="px-4">Fecha</TableHead>
                    <TableHead className="px-4">Empleado</TableHead>
                    <TableHead className="px-4">Concepto</TableHead>
                    <TableHead className="text-right px-4">Monto</TableHead>
                    <TableHead className="text-center px-4">Estado</TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (incidents?.length ?? 0) > 0 ? (
                      incidents?.map((inc, index) => (
                        <motion.tr
                          key={inc.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="group border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="py-3 px-4 text-xs font-medium">
                            {format(new Date(inc.date), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-bold text-sm">
                              {inc.employee?.firstName} {inc.employee?.lastName}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  "h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]",
                                  inc.concept?.category === "INCOME"
                                    ? "bg-blue-500/10 text-blue-600 border-blue-200"
                                    : "bg-red-500/10 text-red-600 border-red-200",
                                )}
                                variant="outline"
                              >
                                {inc.concept?.category === "INCOME" ? "+" : "-"}
                              </Badge>
                              <span className="text-xs font-medium">
                                {inc.concept?.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3 px-4 font-mono-data text-xs font-bold">
                            {formatCurrency(inc.amount)}
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            {inc.status === "PENDING" ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-bold tracking-tighter"
                              >
                                Pendiente
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-bold text-green-600 border-green-200 bg-green-50/50"
                              >
                                Procesado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            {inc.status === "PENDING" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={() => deleteIncident.mutate(inc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
                          className="text-center h-48 text-muted-foreground italic"
                        >
                          No hay novedades registradas.
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <IncidentDialog open={open} onOpenChange={setOpen} />
    </SidebarInset>
  );
}
