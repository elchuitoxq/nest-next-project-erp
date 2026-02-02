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

export default function OrdersPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const {
    data: ordersResponse,
    isLoading,
    isError,
  } = useOrders({
    type: "SALE",
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
        "¿Estás seguro de confirmar el pedido? Esto descontará el inventario.",
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
      confirm("¿Recalcular pedido con la tasa actual? El total se actualizará.")
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
        "¿Estás seguro de cancelar el pedido?" +
          (order.status === "CONFIRMED"
            ? " El stock será devuelto al almacén."
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
    if (confirm("¿Generar factura para este pedido?")) {
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
              <BreadcrumbItem>
                <BreadcrumbPage>Pedidos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Pedidos de Venta
            </h2>
            <p className="text-muted-foreground">
              Gestión y seguimiento de pedidos de clientes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
            </Button>
          </div>
        </div>

        <OrderStatusCards type="SALE" />

        <Card>
          <CardHeader>
            <CardTitle>Historial de Pedidos</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Visualiza y administra todos los pedidos de venta registrados en
                el sistema.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar pedidos.
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

        <OrderDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
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
