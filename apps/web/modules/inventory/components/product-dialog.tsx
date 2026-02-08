import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Package,
  Tag,
  Info,
  Coins,
  BarChart3,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { useProductMutations } from "../hooks/use-products";
import { Product } from "../types";
import {
  createProductSchema,
  CreateProductFormValues,
} from "../schemas/product.schema";
import { GuideCard } from "@/components/guide/guide-card";
import { GuideHint } from "@/components/guide/guide-hint";

interface ProductDialogProps {
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDialog({
  product,
  open,
  onOpenChange,
}: ProductDialogProps) {
  const isEdit = !!product;
  const { createProduct, updateProduct } = useProductMutations();

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      cost: 0,
      price: 0,
      taxRate: 16,
      minStock: 0,
      isExempt: false,
    },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        cost: Number(product.cost),
        price: Number(product.price),
        taxRate: Number(product.taxRate),
        minStock: Number(product.minStock),
        isExempt: product.isExempt,
        currencyId: product.currencyId || undefined,
      });
    } else if (!product && open) {
      form.reset({
        sku: "",
        name: "",
        description: "",
        cost: 0,
        price: 0,
        taxRate: 16,
        minStock: 0,
        isExempt: false,
        currencyId: undefined,
      });
    }
  }, [product, open, form]);

  const onSubmit = async (data: CreateProductFormValues) => {
    try {
      if (isEdit && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...data,
        });
      } else {
        await createProduct.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
              <Package className="size-6" />
            </div>
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription className="ml-12">
            {isEdit
              ? "Modifica los detalles técnicos y comerciales del producto."
              : "Registra un nuevo producto en el catálogo de inventario."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4">
          <GuideCard
            title="Guía de Configuración"
            variant="tip"
            className="mt-2"
          >
            <div className="grid sm:grid-cols-2 gap-4 text-[11px]">
              <div className="flex gap-2">
                <Info className="size-4 shrink-0 text-blue-500" />
                <p>
                  <strong>Exento de IVA:</strong> Marque para productos frescos,
                  servicios específicos o medicina básica.
                </p>
              </div>
              <div className="flex gap-2">
                <Coins className="size-4 shrink-0 text-yellow-600" />
                <p>
                  <strong>Moneda USD:</strong> Use USD para mantener precios
                  estables; el sistema calculará a Bs al facturar.
                </p>
              </div>
            </div>
          </GuideCard>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <div className="grid md:grid-cols-2 gap-6 p-4">
              {/* Columna Izquierda: Identificación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <Tag className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                    Identificación
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU / Código</FormLabel>
                        <FormControl>
                          <Input placeholder="PROD-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Comercial</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Harina Pan 1kg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Detalles adicionales del producto"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 border-b pb-2 mt-4 mb-2">
                  <BarChart3 className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                    Control de Inventario
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Alerta automática al llegar a este nivel.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Columna Derecha: Precios e Impuestos */}
              <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-2">
                  <Coins className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                    Costos y Precios
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo de Compra</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              className="pl-6"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Venta</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-primary text-xs font-bold">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              className="pl-6 border-primary/30"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="currencyId"
                    render={({ field }) => {
                      const { data: currencies } = useQuery({
                        queryKey: ["currencies"],
                        queryFn: async () => {
                          const { data } = await api.get<any[]>(
                            "/settings/currencies",
                          );
                          return data;
                        },
                      });

                      return (
                        <FormItem>
                          <FormLabel>Moneda</FormLabel>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Seleccionar</option>
                            {currencies?.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code}
                              </option>
                            ))}
                          </select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aliacuota IVA</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="1"
                              className="pr-8"
                              {...field}
                            />
                            <span className="absolute right-3 top-2.5 text-muted-foreground text-xs">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mt-4 mb-2">
                  <Settings2 className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                    Configuración Fiscal
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="isExempt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border bg-background p-3 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-bold">
                          EXENTO DE IVA
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Marque para productos sin impuesto.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto px-8"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
                className="w-full sm:w-auto px-8"
              >
                {(createProduct.isPending || updateProduct.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Actualizar Producto" : "Guardar Producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
