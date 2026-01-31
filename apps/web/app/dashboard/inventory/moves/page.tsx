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

import { useInventoryMoves } from "@/modules/inventory/hooks/use-inventory";
import { MovesTable } from "@/modules/inventory/components/moves-table";
import { MoveDialog } from "@/modules/inventory/components/move-dialog";
import { MoveDetailsDialog } from "@/modules/inventory/components/move-details-dialog";
import { Move } from "@/modules/inventory/types";
import { PaginationState } from "@tanstack/react-table";

export default function InventoryMovesPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const {
    data: movesResponse,
    isLoading,
    isError,
  } = useInventoryMoves({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
    type: typeFilter.length > 0 ? typeFilter : undefined,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

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
                <BreadcrumbLink href="#">Inventario</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Movimientos (Kardex)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Movimientos de Inventario
            </h2>
            <p className="text-muted-foreground">
              Historial de entradas, salidas y transferencias.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Registrar Movimiento
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kardex Global</CardTitle>
            <CardDescription>
              Visualiza todas las transacciones de inventario en orden
              cronológico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar historial. Por favor intente nuevamente.
              </div>
            ) : (
              <MovesTable
                data={movesResponse?.data || []}
                pageCount={movesResponse?.meta.lastPage || 1}
                pagination={pagination}
                onPaginationChange={setPagination}
                isLoading={isLoading}
                onSelectMove={(move) => {
                  setSelectedMove(move);
                  setIsDetailsOpen(true);
                }}
                search={search}
                onSearchChange={setSearch}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
              />
            )}
          </CardContent>
        </Card>

        <MoveDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        <MoveDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          move={selectedMove}
        />
      </div>
    </SidebarInset>
  );
}
