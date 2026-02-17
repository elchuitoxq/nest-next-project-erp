"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, FileText, Briefcase, Calendar } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ContractsTab } from "@/modules/hr/components/tabs/contracts-tab";
import { BenefitsTab } from "@/modules/hr/components/tabs/benefits-tab";
import { VacationsTab } from "@/modules/hr/components/tabs/vacations-tab";
import { ProfitSharingTab } from "@/modules/hr/components/tabs/profit-sharing-tab";
import { IncidentsTab } from "@/modules/hr/components/tabs/incidents-tab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function EmployeeDetailPage() {
  const { id } = useParams();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data } = await api.get(`/hr/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SidebarInset>
    );
  }

  if (!employee) {
    return (
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Empleado no encontrado</h2>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <AppHeader />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  {employee.identityCard}
                </Badge>
                <span>•</span>
                <span>{employee.position?.name || "Sin Cargo"}</span>
                <span>•</span>
                <Badge
                  variant={
                    employee.status === "ACTIVE" ? "success" : "secondary"
                  }
                  className="text-[10px] uppercase font-bold"
                >
                  {employee.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="premium-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Departamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                {employee.department?.name || "-"}
              </div>
            </CardContent>
          </Card>
          <Card className="premium-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Salario Base
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg font-semibold flex items-center gap-2">
                <span className="font-mono">
                  {formatCurrency(
                    employee.baseSalary,
                    employee.salaryCurrency?.code || "Bs",
                  )}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  /{" "}
                  {employee.payFrequency === "BIWEEKLY"
                    ? "Quincenal"
                    : "Mensual"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="premium-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fecha de Ingreso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {new Date(employee.hireDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for details */}
        <Tabs defaultValue="contracts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="contracts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              Contratos
            </TabsTrigger>
            <TabsTrigger
              value="benefits"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Prestaciones
            </TabsTrigger>
            <TabsTrigger
              value="vacations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Vacaciones
            </TabsTrigger>
            <TabsTrigger
              value="utilities"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Utilidades
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Novedades
            </TabsTrigger>
          </TabsList>

          <div className="pt-6">
            <TabsContent value="contracts" className="m-0">
              <ContractsTab employeeId={id as string} />
            </TabsContent>
            <TabsContent value="benefits" className="m-0">
              <BenefitsTab employeeId={id as string} />
            </TabsContent>
            <TabsContent value="vacations" className="m-0">
              <VacationsTab employeeId={id as string} />
            </TabsContent>
            <TabsContent value="utilities" className="m-0">
              <ProfitSharingTab employeeId={id as string} />
            </TabsContent>
            <TabsContent value="incidents" className="m-0">
              <IncidentsTab employeeId={id as string} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </SidebarInset>
  );
}
