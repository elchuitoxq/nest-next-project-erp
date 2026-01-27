"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useIncidents, useIncidentMutations } from "@/modules/hr/incidents/hooks/use-incidents";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { IncidentDialog } from "@/modules/hr/incidents/components/incident-dialog";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PayrollIncidentsPage() {
  const { data: incidents, isLoading } = useIncidents();
  const { deleteIncident } = useIncidentMutations();
  const [open, setOpen] = useState(false);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">RRHH</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Novedades</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registro de Novedades</h1>
            <p className="text-muted-foreground">Faltas, horas extra, bonos y deducciones.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Registrar Novedad
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Cargando...</TableCell>
                    </TableRow>
                  ) : incidents?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">No hay novedades registradas.</TableCell>
                    </TableRow>
                  ) : (
                    incidents?.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell>{format(new Date(inc.date), "dd MMM yyyy", { locale: es })}</TableCell>
                        <TableCell className="font-medium">{inc.employee?.firstName} {inc.employee?.lastName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={inc.concept?.category === "INCOME" ? "default" : "destructive"}>
                              {inc.concept?.category === "INCOME" ? "+" : "-"}
                            </Badge>
                            {inc.concept?.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(inc.amount)}</TableCell>
                        <TableCell className="text-center">
                          {inc.status === "PENDING" ? (
                            <Badge variant="secondary">Pendiente</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Procesado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {inc.status === "PENDING" && (
                            <Button variant="ghost" size="icon" onClick={() => deleteIncident.mutate(inc.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <IncidentDialog open={open} onOpenChange={setOpen} />
    </SidebarInset>
  );
}
