"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";

import { useInvoices } from "@/modules/billing/hooks/use-invoices";
import { InvoicesTable } from "@/modules/billing/components/invoices-table";
import { InvoiceDetailsDialog } from "@/modules/billing/components/invoice-details-dialog";
import { InvoiceStatusCards } from "@/modules/billing/components/invoice-status-cards";
import { Invoice } from "@/modules/billing/types";
import { PaginationState } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { GuideCard } from "@/components/guide/guide-card";
import { GuideHint } from "@/components/guide/guide-hint";
import { DocumentFlow } from "@/modules/common/components/document-flow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InvoicesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL State Helpers
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams],
  );

  // 1. Pagination State (Synced with URL)
  // Default to page 1 if missing, 0, or invalid. Math.max ensures we never get negative index.
  const pageIndex = Math.max(0, (Number(searchParams.get("page")) || 1) - 1);
  const pageSize = Number(searchParams.get("limit")) || 25;

  const setPagination = (
    updaterOrValue:
      | PaginationState
      | ((old: PaginationState) => PaginationState),
  ) => {
    let newState: PaginationState;
    if (typeof updaterOrValue === "function") {
      newState = updaterOrValue({ pageIndex, pageSize });
    } else {
      newState = updaterOrValue;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (newState.pageIndex + 1).toString());
    params.set("limit", newState.pageSize.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  // 2. Filter States (Synced with URL)
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status")?.split(",") || [];
  const typeFilter = searchParams.get("type")?.split(",") || [];

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (value: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.length > 0) params.set("status", value.join(","));
    else params.delete("status");
    // Reset page on filter change
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleTypeChange = (value: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.length > 0) params.set("type", value.join(","));
    else params.delete("type");
    // Reset page on filter change
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  // 3. Data Fetching
  const {
    data: invoicesResponse,
    isLoading,
    isError,
  } = useInvoices({
    page: pageIndex + 1,
    limit: pageSize,
    search: search,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    type: typeFilter.length > 0 ? typeFilter : undefined,
  });

  // 4. Interaction State (Local)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeInvoice = invoicesResponse?.data?.find(
    (inv) => inv.id === selectedId,
  );

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedId(invoice.id);
    setIsDetailsOpen(true);
  };

  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const handleViewFlow = (invoice: Invoice) => {
    setSelectedId(invoice.id);
    setIsFlowOpen(true);
  };

  return (
    <SidebarInset>
      <AppHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title="Facturas"
          description="Gestiona las facturas de venta."
        />

        <InvoiceStatusCards
          type={(typeFilter[0] as "SALE" | "PURCHASE") || "SALE"}
        />

        <GuideCard
          title="Gestión de Facturación & Libros Legales"
          variant="info"
        >
          <p className="mb-2">
            Este módulo es el espejo de sus{" "}
            <strong>Libros de Compra y Venta</strong>. Cada documento aquí
            impacta directamente en su declaración del SENIAT.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Estatus "Publicada":</strong> El documento ya tiene número
              de control y es definitivo. Anularlo requiere nota de crédito.
            </li>
            <li>
              <strong>Estatus "Borrador":</strong> No tiene validez fiscal aún.
              Puede ser editado o eliminado sin rastro.
            </li>
          </ul>
        </GuideCard>

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
                pagination={{ pageIndex, pageSize }}
                onPaginationChange={setPagination}
                onViewDetails={handleViewDetails}
                onViewFlow={handleViewFlow}
                isLoading={isLoading}
                search={search}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                typeFilter={typeFilter}
                onTypeChange={handleTypeChange}
              />
            )}
          </CardContent>
        </Card>

        <InvoiceDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          invoice={activeInvoice}
        />

        <Dialog open={isFlowOpen} onOpenChange={setIsFlowOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Flujo Documental</DialogTitle>
            </DialogHeader>
            {selectedId && <DocumentFlow documentId={selectedId} />}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
}
