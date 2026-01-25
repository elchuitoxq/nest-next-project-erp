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
import { RetentionsTable } from "@/modules/treasury/components/retentions-table";
import { List } from "lucide-react";

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

type RetentionType = "IVA" | "ISLR";

export default function RetentionsPage() {
  const [activeTab, setActiveTab] = useState<RetentionType>("IVA");

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
                <BreadcrumbPage>Retenciones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Retenciones de Impuestos
          </h1>
          <p className="text-muted-foreground">
            Consulta y descarga de comprobantes de retención IVA e ISLR.
          </p>
        </div>

        <div className="flex items-center gap-2 border-b pb-4">
          <Button
            variant={activeTab === "IVA" ? "default" : "ghost"}
            onClick={() => setActiveTab("IVA")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Retenciones IVA
          </Button>
          <Button
            variant={activeTab === "ISLR" ? "default" : "ghost"}
            onClick={() => setActiveTab("ISLR")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Retenciones ISLR
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "IVA" ? "Retenciones de IVA" : "Retenciones de ISLR"}
            </CardTitle>
            <CardDescription>
              {activeTab === "IVA"
                ? "Listado de retenciones aplicadas sobre el impuesto al valor agregado."
                : "Listado de retenciones aplicadas sobre el impuesto sobre la renta."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RetentionsTable type={activeTab} />
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
