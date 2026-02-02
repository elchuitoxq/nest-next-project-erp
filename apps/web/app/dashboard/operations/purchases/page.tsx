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
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

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

import { motion } from "framer-motion";

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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb />
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Órdenes de Compra
            </h2>
            <p className="text-muted-foreground text-sm">
              Gestión de abastecimiento y pedidos a proveedores
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva Orden
            </Button>
          </div>
        </div>

        <OrderStatusCards type="PURCHASE" />

        <Card className="border shadow-xl bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Historial de Compras
            </CardTitle>
            <CardDescription>
              Registro completo de órdenes de compra y recepciones de mercancía
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-12 text-center border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                <p className="font-semibold text-lg">Error al cargar órdenes</p>
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
          type="PURCHASE"
          onConfirm={executeConfirm}
          onCancel={executeCancel}
          onGenerateInvoice={executeGenerateInvoice}
          onRecalculate={executeRecalculate}
        />
      </motion.div>
    </SidebarInset>
  );
}
