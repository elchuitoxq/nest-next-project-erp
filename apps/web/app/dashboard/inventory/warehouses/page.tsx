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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useWarehouses } from "@/modules/inventory/hooks/use-inventory";
import { WarehouseDialog } from "@/modules/inventory/components/warehouse-dialog";
import { Badge } from "@/components/ui/badge";
import { WarehouseStockDialog } from "@/modules/inventory/components/warehouse-stock-dialog";
import { Warehouse } from "@/modules/inventory/types";

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
                <BreadcrumbPage>Almacenes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Almacenes</h2>
            <p className="text-muted-foreground">
              Gestiona los almacenes y depósitos de inventario.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Almacén
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && <Loader2 className="h-8 w-8 animate-spin" />}
          {warehouses?.map((warehouse) => (
            <Card key={warehouse.id} className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">
                    {warehouse.name}
                  </CardTitle>
                  {warehouse.isActive ? (
                    <Badge variant="default" className="text-xs">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="break-words">
                    {warehouse.address || "Sin dirección registrada"}
                  </span>
                </div>
                {warehouse.branch && (
                  <p className="text-xs font-medium text-foreground mt-2">
                    Sucursal: {warehouse.branch.name}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewStock(warehouse)}
                >
                  Inventario
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(warehouse)}
                >
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))}
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
      </div>
    </SidebarInset>
  );
}
