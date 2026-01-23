"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";

import { usePurchases } from "@/modules/billing/hooks/use-purchases";
import { InvoicesTable } from "@/modules/billing/components/invoices-table";
import { InvoiceDetailsDialog } from "@/modules/billing/components/invoice-details-dialog";
import { PurchaseDialog } from "@/modules/billing/components/purchase-dialog";
import { Invoice } from "@/modules/billing/types";

export default function PurchasesPage() {
  const { data: invoices, isLoading, isError } = usePurchases();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
                <BreadcrumbLink href="#">Operaciones</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Compras</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
            <p className="text-muted-foreground">
              Gestione las facturas de proveedores y cuentas por pagar.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Registrar Compra
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
            <CardDescription>
              Listado de facturas registradas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar compras.
              </div>
            ) : (
              <InvoicesTable
                invoices={invoices || []}
                onViewDetails={handleViewDetails}
                type="PURCHASE"
              />
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <InvoiceDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          invoice={activeInvoice}
        />

        <PurchaseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </SidebarInset>
  );
}
