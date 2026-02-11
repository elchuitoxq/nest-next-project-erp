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
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

import { ProductsTable } from "@/modules/inventory/components/products-table";
import { ProductDialog } from "@/modules/inventory/components/product-dialog";
import { useProducts } from "@/modules/inventory/hooks/use-products";
import { Product } from "@/modules/inventory/types";
import { Input } from "@/components/ui/input";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading, isError } = useProducts(search);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(
    undefined,
  );

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Catálogo de Productos"
          description="Define los productos y servicios que ofrece tu empresa."
        >
          <Button onClick={handleCreate} className="premium-shadow">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </PageHeader>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado</CardTitle>
                <CardDescription>
                  Gestiona tu base de datos de productos.
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Cargando catálogo...
                </p>
              </div>
            ) : isError ? (
              <div className="text-red-500 py-12 text-center border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                <p className="font-semibold text-lg">
                  Error al cargar productos
                </p>
                <p className="text-sm">Por favor intente nuevamente.</p>
              </div>
            ) : (
              <ProductsTable
                products={products || []}
                onEdit={handleEdit}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>

        <ProductDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={selectedProduct}
        />
      </motion.div>
    </SidebarInset>
  );
}
