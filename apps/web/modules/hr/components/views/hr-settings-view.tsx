"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollSettingsTab } from "@/modules/hr/components/tabs/payroll-settings-tab";
import { motion } from "framer-motion";
import { Briefcase, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PermissionsGate } from "@/components/auth/permissions-gate";
import { PERMISSIONS } from "@repo/db/permissions";

export function HrSettingsView() {
  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Configuración de Recursos Humanos"
          description="Gestiona los parámetros de nómina y la estructura organizacional de la empresa."
        />

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="general">Parámetros de Nómina</TabsTrigger>
            <TabsTrigger value="org">Estructura Organizacional</TabsTrigger>
            <TabsTrigger value="concepts" disabled>
              Conceptos (Próximamente)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="pt-4 space-y-4">
            <PermissionsGate permission={PERMISSIONS.HR.SETTINGS.VIEW}>
              <PayrollSettingsTab />
            </PermissionsGate>
          </TabsContent>

          <TabsContent value="org" className="pt-4 space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <PermissionsGate permission={PERMISSIONS.HR.EMPLOYEES.VIEW}>
                <Link href="/dashboard/hr/positions">
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer group premium-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Cargos y Salarios
                      </CardTitle>
                      <Briefcase className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Define los puestos de trabajo y tabuladores
                          salariales.
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </PermissionsGate>

              <PermissionsGate permission={PERMISSIONS.HR.EMPLOYEES.VIEW}>
                <Link href="/dashboard/hr/departments">
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer group premium-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Departamentos
                      </CardTitle>
                      <Building2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Gestiona la jerarquía de las unidades organizativas.
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </PermissionsGate>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </SidebarInset>
  );
}
