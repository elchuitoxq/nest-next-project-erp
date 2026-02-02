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
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

import { useInvoices } from "@/modules/billing/hooks/use-invoices";
import { InvoicesTable } from "@/modules/billing/components/invoices-table";
import { InvoiceDetailsDialog } from "@/modules/billing/components/invoice-details-dialog";
import { InvoiceStatusCards } from "@/modules/billing/components/invoice-status-cards";
import { Invoice } from "@/modules/billing/types";
import { PaginationState } from "@tanstack/react-table";

export default function InvoicesPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  // Change to string arrays for multiple selection
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const {
    data: invoicesResponse,
    isLoading,
    isError,
  } = useInvoices({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
    // Pass arrays directly if they have items, otherwise undefined
    status: statusFilter.length > 0 ? statusFilter : undefined,
    type: typeFilter.length > 0 ? typeFilter : undefined,
  });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeInvoice = invoicesResponse?.data?.find(
    (inv) => inv.id === selectedId,
  );

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedId(invoice.id);
    setIsDetailsOpen(true);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb />
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

        <InvoiceStatusCards
          type={(typeFilter[0] as "SALE" | "PURCHASE") || "SALE"}
        />

        <Card className="premium-shadow">
          <CardHeader>
            <CardTitle>Listado de Facturas</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Visualiza y gestiona las facturas emitidas.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar facturas.
              </div>
            ) : (
              <InvoicesTable
                data={invoicesResponse?.data || []}
                pageCount={invoicesResponse?.meta.lastPage || 1}
                pagination={pagination}
                onPaginationChange={setPagination}
                onViewDetails={handleViewDetails}
                isLoading={isLoading}
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
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
