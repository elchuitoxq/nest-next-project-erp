import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

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
          <DialogTitle>
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los detalles del producto."
              : "Ingresa los datos del nuevo producto del catálogo."}
          </DialogDescription>
        </DialogHeader>

        <GuideCard
          title="Definición de Producto"
          variant="tip"
          className="mx-4 mt-2"
        >
          <p className="mb-1">
            Una correcta definición evita errores en facturación:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Exento de IVA:</strong> Para productos de canasta básica o
              legales.
            </li>
            <li>
              <strong>Moneda USD:</strong> El sistema convertirá automáticamente
              a Bolívares según la tasa del día al facturar.
            </li>
          </ul>
        </GuideCard>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
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
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción corta" {...field} />
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
                  <FormLabel>Descripción Detallada</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                    <FormLabel>Precio Venta</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IVA (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isExempt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Exento de IVA</FormLabel>
                    <FormDescription>
                      Marcar si este producto no grava impuesto.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Currency Selector */}
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
                      <FormLabel className="flex items-center">
                        Moneda de Precio
                        <GuideHint text="Define en qué moneda se mantiene fijo el precio. Recomendado: USD para evitar ajustes constantes por inflación." />
                      </FormLabel>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Seleccionar Moneda</option>
                        {currencies?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.symbol}
                          </option>
                        ))}
                      </select>
                      <FormDescription>
                        Si seleccionas USD, el precio se convertirá a Bs al
                        facturar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {(createProduct.isPending || updateProduct.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
