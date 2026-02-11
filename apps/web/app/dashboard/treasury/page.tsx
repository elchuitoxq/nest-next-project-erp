"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobalPaymentForm } from "@/modules/treasury/components/global-payment-form";
import { GlobalPaymentsTable } from "@/modules/treasury/components/global-payments-table";
import { cn } from "@/lib/utils";
import { Plus, List, ArrowLeftRight } from "lucide-react";

type Tab = "history" | "new";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { PageHeader } from "@/components/layout/page-header";

export default function TreasuryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("history");

  return (
    <SidebarInset>
      <AppHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title="Pagos y Cobranzas"
          description="Gestión centralizada de pagos recibidos, cuentas bancarias y flujo de caja."
        />

        <div className="flex items-center gap-2 border-b pb-4">
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            onClick={() => setActiveTab("history")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Movimientos
          </Button>
          <Button
            variant={activeTab === "new" ? "default" : "ghost"}
            onClick={() => setActiveTab("new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Registrar Pago
          </Button>
        </div>

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Todos los pagos recibidos ordenados cronológicamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalPaymentsTable />
            </CardContent>
          </Card>
        )}

        {activeTab === "new" && (
          <div>
            <GlobalPaymentForm />
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
