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
import { useEmployees, Employee } from "@/modules/hr/hooks/use-employees";
import { EmployeeDialog } from "@/modules/hr/components/employee-dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedEmployee(undefined);
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
                <BreadcrumbPage>Empleados</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Empleados</h1>
            <p className="text-muted-foreground">Gestión de personal y nómina.</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Empleado
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salario Base</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Skeleton className="h-4 w-[250px] mx-auto" />
                  </TableCell>
                </TableRow>
              ) : employees?.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(emp)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                      <span className="text-xs text-muted-foreground">{emp.identityCard}</span>
                    </div>
                  </TableCell>
                  <TableCell>{emp.position?.name || "-"}</TableCell>
                  <TableCell>
                    {formatCurrency(emp.baseSalary, emp.salaryCurrency?.code)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.payFrequency}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={emp.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-500'}>
                        {emp.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!employees || employees.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay empleados registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <EmployeeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employee={selectedEmployee}
        />
      </div>
    </SidebarInset>
  );
}
