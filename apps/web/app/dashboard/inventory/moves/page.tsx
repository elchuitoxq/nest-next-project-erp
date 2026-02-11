"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useInventoryMoves } from "@/modules/inventory/hooks/use-inventory";
import { MovesTable } from "@/modules/inventory/components/moves-table";
import { MoveDialog } from "@/modules/inventory/components/move-dialog";
import { MoveDetailsDialog } from "@/modules/inventory/components/move-details-dialog";
import { Move } from "@/modules/inventory/types";
import { PaginationState } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";

import { motion } from "framer-motion";

export default function InventoryMovesPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, typeFilter]);

  const {
    data: movesResponse,
    isLoading,
    isError,
  } = useInventoryMoves({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search,
    type: typeFilter.length > 0 ? typeFilter : undefined,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Movimientos de Inventario"
          description="Historial de entradas, salidas y transferencias."
        >
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="premium-shadow"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Movimiento
          </Button>
        </PageHeader>

        <Card className="border premium-shadow">
          <CardHeader>
            <CardTitle>Kardex Global</CardTitle>
            <CardDescription>
              Visualiza todas las transacciones de inventario en orden
              cronológico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-12 text-center border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                <p className="font-semibold text-lg">
                  Error al cargar historial
                </p>
                <p className="text-sm">Por favor intente nuevamente.</p>
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
      </motion.div>
    </SidebarInset>
  );
}
