"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus, Eye, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayrolls } from "@/modules/hr/hooks/use-payroll";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PayrollGeneratorDialog } from "@/modules/hr/components/payroll/generator-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PayrollListPage() {
  const { data: payrolls, isLoading } = usePayrolls();
  const [openGenerator, setOpenGenerator] = useState(false);
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Borrador</Badge>;
      case "PUBLISHED":
        return <Badge className="bg-blue-600">Publicada</Badge>;
      case "PAID":
        return <Badge className="bg-green-600">Pagada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
                <BreadcrumbPage>Nóminas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Nómina</h1>
            <p className="text-muted-foreground">
              Historial de pagos y generación de nuevas nóminas.
            </p>
          </div>
          <Button onClick={() => setOpenGenerator(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Procesar Nómina
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : payrolls?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No hay nóminas registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrolls?.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono">{run.code}</TableCell>
                        <TableCell>
                          {format(new Date(run.startDate), "dd MMM", { locale: es })} -{" "}
                          {format(new Date(run.endDate), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {run.frequency === "BIWEEKLY"
                            ? "Quincenal"
                            : run.frequency === "WEEKLY"
                            ? "Semanal"
                            : "Mensual"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(run.totalAmount, run.currency?.code)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(run.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/hr/payroll/${run.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <PayrollGeneratorDialog 
        open={openGenerator} 
        onOpenChange={setOpenGenerator} 
      />
    </SidebarInset>
  );
}
