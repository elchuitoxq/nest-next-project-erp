"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import { useInvoices } from "@/modules/billing/hooks/use-invoices";
import { InvoicesTable } from "@/modules/billing/components/invoices-table";
import { InvoiceDetailsDialog } from "@/modules/billing/components/invoice-details-dialog";
import { Invoice } from "@/modules/billing/types";

export default function InvoicesPage() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeInvoice = invoices?.find((inv) => inv.id === selectedId);

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedId(invoice.id);
    setIsDetailsOpen(true);
  };

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
                <BreadcrumbLink href="#">Facturación</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Facturas de Venta</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Facturas</h2>
            <p className="text-muted-foreground">
              Gestiona las facturas de venta.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Facturas</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Visualiza y gestiona las facturas emitidas.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar facturas.
              </div>
            ) : (
              <InvoicesTable
                invoices={invoices || []}
                onViewDetails={handleViewDetails}
              />
            )}
          </CardContent>
        </Card>

        <InvoiceDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          invoice={activeInvoice}
        />
      </div>
    </SidebarInset>
  );
}
