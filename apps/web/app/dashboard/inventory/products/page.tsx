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

import { ProductsTable } from "@/modules/inventory/components/products-table";
import { ProductDialog } from "@/modules/inventory/components/product-dialog";
import { useProducts } from "@/modules/inventory/hooks/use-products";
import { Product } from "@/modules/inventory/types";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading, isError } = useProducts(search);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(
    undefined
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
                <BreadcrumbPage>Productos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Catálogo de Productos
            </h2>
            <p className="text-muted-foreground">
              Define los productos y servicios que ofrece tu empresa.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Gestiona tu base de datos de productos.
              </CardDescription>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar productos. Por favor intente nuevamente.
              </div>
            ) : (
              <ProductsTable products={products || []} onEdit={handleEdit} />
            )}
          </CardContent>
        </Card>

        <ProductDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={selectedProduct}
        />
      </div>
    </SidebarInset>
  );
}
