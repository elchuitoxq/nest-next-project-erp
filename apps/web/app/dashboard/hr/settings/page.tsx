"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollSettingsTab } from "@/modules/hr/components/tabs/payroll-settings-tab";
import { motion } from "framer-motion";

export default function PayrollSettingsPage() {
  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Configuración de Nómina"
          description="Gestiona los valores globales, conceptos de ley y parámetros para el cálculo de nómina."
        />

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">Valores y Porcentajes</TabsTrigger>
            <TabsTrigger value="concepts" disabled>
              Conceptos (Próximamente)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4">
            <PayrollSettingsTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </SidebarInset>
  );
}
