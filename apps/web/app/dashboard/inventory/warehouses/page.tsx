"use client";

import { useState } from "react";
import { Plus, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

import { useWarehouses } from "@/modules/inventory/hooks/use-inventory";
import { WarehouseDialog } from "@/modules/inventory/components/warehouse-dialog";
import { Badge } from "@/components/ui/badge";
import { WarehouseStockDialog } from "@/modules/inventory/components/warehouse-stock-dialog";
import { Warehouse } from "@/modules/inventory/types";

import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";

export default function WarehousesPage() {
  const { data: warehouses, isLoading, isError } = useWarehouses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedWarehouse, setSelectedWarehouse] = useState<
    Warehouse | undefined
  >(undefined);
  const [isStockOpen, setIsStockOpen] = useState(false);

  const handleViewStock = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsStockOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedWarehouse(undefined);
    setIsDialogOpen(true);
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
        <PageHeader
          title="Almacenes"
          description="Gestiona los almacenes y depósitos de inventario."
        >
          <Button onClick={handleCreate} className="premium-shadow">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Almacén
          </Button>
        </PageHeader>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="border shadow-xl bg-white/60 backdrop-blur-sm group hover:shadow-2xl transition-all duration-300 animate-pulse"
                >
                  <CardHeader className="h-24 bg-muted/20" />
                  <CardContent className="h-32" />
                </Card>
              ))
            ) : isError ? (
              <div className="col-span-full text-red-500 py-12 text-center border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                <p className="font-semibold text-lg">
                  Error al cargar almacenes
                </p>
                <p className="text-sm">Por favor intente nuevamente.</p>
              </div>
            ) : (
              warehouses?.map((warehouse, index) => (
                <motion.div
                  key={warehouse.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="flex flex-col justify-between premium-shadow border-none hover:ring-2 hover:ring-primary/20 transition-all duration-300 group h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                          {warehouse.name}
                        </CardTitle>
                        {warehouse.isActive ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold bg-green-500/10 text-green-600 border-green-200"
                          >
                            Activo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold bg-gray-500/10 text-gray-500 border-gray-200"
                          >
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                        <span className="leading-relaxed">
                          {warehouse.address || "Sin dirección registrada"}
                        </span>
                      </div>
                      {warehouse.branch && (
                        <div className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/10">
                          Sucursal: {warehouse.branch.name}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-2 border-t bg-muted/5 p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs font-bold uppercase tracking-tight h-9"
                        onClick={() => handleViewStock(warehouse)}
                      >
                        Inventario
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs font-bold uppercase tracking-tight h-9"
                        onClick={() => handleEdit(warehouse)}
                      >
                        Editar
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <WarehouseDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          warehouse={selectedWarehouse}
        />

        <WarehouseStockDialog
          open={isStockOpen}
          onOpenChange={setIsStockOpen}
          warehouse={selectedWarehouse}
        />
      </motion.div>
    </SidebarInset>
  );
}
