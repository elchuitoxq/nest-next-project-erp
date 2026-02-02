"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

import {
  useOrders,
  useOrderMutations,
} from "@/modules/orders/hooks/use-orders";
import { OrdersTable } from "@/modules/orders/components/orders-table";
import { OrderDialog } from "@/modules/orders/components/order-dialog";
import { OrderDetailsDialog } from "@/modules/orders/components/order-details-dialog";
import { OrderStatusCards } from "@/modules/orders/components/order-status-cards";
import { Order } from "@/modules/orders/types";
import { PaginationState } from "@tanstack/react-table";

export default function PurchaseOrdersPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Pass 'PURCHASE' to filter
  const {
    data: ordersResponse,
    isLoading,
    isError,
  } = useOrders({
    type: "PURCHASE",
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
    status: statusFilter.length > 0 ? statusFilter : undefined,
  });

  const { confirmOrder, cancelOrder, generateInvoice, recalculateOrder } =
    useOrderMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedOrder = ordersResponse?.data?.find(
    (order) => order.id === selectedId,
  );

  const executeConfirm = async (order: Order) => {
    if (
      confirm(
        "¿Confirmar Orden de Compra? Esto aumentará el inventario en el almacén destino.",
      )
    ) {
      try {
        await confirmOrder.mutateAsync(order.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const executeRecalculate = async (order: Order) => {
    if (
      confirm("¿Recalcular orden con la tasa actual? El total se actualizará.")
    ) {
      try {
        await recalculateOrder.mutateAsync(order.id);
        setIsDetailsOpen(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const executeCancel = async (order: Order) => {
    if (
      confirm(
        "¿Cancelar Orden de Compra?" +
          (order.status === "CONFIRMED"
            ? " El stock será retirado del almacén (Devolución)."
            : ""),
      )
    ) {
      try {
        await cancelOrder.mutateAsync(order.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const executeGenerateInvoice = async (order: Order) => {
    if (
      confirm("¿Generar Factura de Compra (Cuenta por Pagar) para esta orden?")
    ) {
      try {
        await generateInvoice.mutateAsync(order.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedId(order.id);
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Compras</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Órdenes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Órdenes de Compra
            </h2>
            <p className="text-muted-foreground">
              Gestión de abastecimiento y pedidos a proveedores.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Orden
            </Button>
          </div>
        </div>

        <OrderStatusCards type="PURCHASE" />

        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Registro completo de órdenes de compra y recepciones de
                mercancía.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar órdenes.
              </div>
            ) : (
              <OrdersTable
                data={ordersResponse?.data || []}
                pageCount={ordersResponse?.meta.lastPage || 1}
                pagination={pagination}
                onPaginationChange={setPagination}
                onViewDetails={handleViewDetails}
                isLoading={isLoading}
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
              />
            )}
          </CardContent>
        </Card>

        <OrderDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          type="PURCHASE"
        />
        <OrderDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          order={selectedOrder}
          onConfirm={executeConfirm}
          onCancel={executeCancel}
          onGenerateInvoice={executeGenerateInvoice}
          onRecalculate={executeRecalculate}
        />
      </div>
    </SidebarInset>
  );
}
