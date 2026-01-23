"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RetentionsTable } from "@/modules/treasury/components/retentions-table";
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

export default function TaxesPage() {
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
                <BreadcrumbLink href="/dashboard/treasury">
                  Tesorería
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Impuestos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-4 py-4">
          <h2 className="text-3xl font-bold tracking-tight">Retenciones</h2>
          <p className="text-muted-foreground">
            Administra y descarga los comprobantes de retención fiscal.
          </p>
        </div>

        <Tabs defaultValue="iva" className="space-y-4">
          <TabsList>
            <TabsTrigger value="iva">Retenciones IVA</TabsTrigger>
            <TabsTrigger value="islr">Retenciones ISLR</TabsTrigger>
          </TabsList>

          <TabsContent value="iva">
            <Card>
              <CardHeader>
                <CardTitle>Comprobantes IVA</CardTitle>
                <CardDescription>
                  Listado de retenciones de IVA aplicadas a facturas de
                  proveedores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RetentionsTable type="IVA" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="islr">
            <Card>
              <CardHeader>
                <CardTitle>Comprobantes ISLR</CardTitle>
                <CardDescription>
                  Listado de retenciones de ISLR por servicios profesionales u
                  otros conceptos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RetentionsTable type="ISLR" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
}
