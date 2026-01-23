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

export default function TreasuryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("history");

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Finanzas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Pagos y Cobranzas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Pagos y Cobranzas
          </h1>
          <p className="text-muted-foreground">
            Gestión centralizada de pagos recibidos, cuentas bancarias y flujo
            de caja.
          </p>
        </div>

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
