"use client";

import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePositions, JobPosition } from "@/modules/hr/hooks/use-positions";
import { PositionDialog } from "@/modules/hr/components/position-dialog";
import { formatCurrency } from "@/lib/utils";

export default function PositionsPage() {
  const { data: positions, isLoading } = usePositions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | undefined>();

  const handleEdit = (pos: JobPosition) => {
    setSelectedPosition(pos);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPosition(undefined);
    setDialogOpen(true);
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
                <BreadcrumbPage>Cargos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cargos y Salarios</h1>
            <p className="text-muted-foreground">Administra los puestos de trabajo y tabuladores salariales.</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cargo
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Rango Salarial (Ref)</TableHead>
                <TableHead>Moneda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Skeleton className="h-4 w-[250px] mx-auto" />
                  </TableCell>
                </TableRow>
              ) : positions?.map((pos) => (
                <TableRow
                  key={pos.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(pos)}
                >
                  <TableCell className="font-medium">{pos.name}</TableCell>
                  <TableCell>{pos.description || "-"}</TableCell>
                  <TableCell>
                    {pos.baseSalaryMin && pos.baseSalaryMax
                      ? `${formatCurrency(pos.baseSalaryMin, pos.currency?.code)} - ${formatCurrency(pos.baseSalaryMax, pos.currency?.code)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{pos.currency?.code || "N/A"}</TableCell>
                </TableRow>
              ))}
              {!isLoading && (!positions || positions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay cargos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <PositionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          position={selectedPosition}
        />
      </div>
    </SidebarInset>
  );
}
