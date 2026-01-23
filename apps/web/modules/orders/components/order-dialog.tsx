import { useEffect, useState } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useOrderMutations } from "../hooks/use-orders";
import { PartnerCombobox } from "@/modules/partners/components/partner-combobox";
import { ProductCombobox } from "@/modules/inventory/components/product-combobox";

import { useWarehouses } from "@/modules/inventory/hooks/use-inventory";
// check useWarehouseStock usage
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const orderSchema = z.object({
  partnerId: z.string().min(1, "Seleccione un cliente"),

  warehouseId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Seleccione un producto"),
        quantity: z.coerce.number().min(1, "Cantidad mínima de 1"),
        price: z.coerce.number().min(0, "Precio inválido"),
        currencyId: z.string().optional(),
        maxQuantity: z.number().optional(), // For validation
      }),
    )
    .min(1, "Agregue al menos un producto"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDialog({ open, onOpenChange }: OrderDialogProps) {
  const { createOrder } = useOrderMutations();
  // Partners fetched by combobox

  const { data: warehouses } = useWarehouses();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      partnerId: "",

      warehouseId: "",
      items: [{ productId: "", quantity: 1, price: 0 }],
    },
  });

  const warehouseId = form.watch("warehouseId");
  // Stock fetched by ProductCombobox internally

  // Fetch Exchange Rates
  const { data: rates } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies/rates/latest");
      return data;
    },
  });

  // Fetch Currencies to know which one is USD/VES
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies");
      return data;
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: OrderFormValues) => {
    try {
      // Deep clone to avoid mutating form state
      const processedData = JSON.parse(JSON.stringify(data));

      // Convert items to VES if needed
      processedData.items = processedData.items.map((item: any) => {
        // We have currencyId in item now.
        if (!item.currencyId) return item;

        const productCurrency = currencies?.find(
          (c) => c.id === item.currencyId,
        );
        const targetCurrency =
          currencies?.find((c) => c.isBase) ||
          currencies?.find((c) => c.code === "VES");

        if (
          productCurrency &&
          targetCurrency &&
          productCurrency.id !== targetCurrency.id &&
          rates
        ) {
          // Logic: Convert Product Currency -> Target Currency (VES)
          // As seen in DualCurrencyDisplay, usually Base is USD and VES has a rate.
          // We need the rate for the TARGET currency (VES) if product is in Base.
          // Or generalized: Find rate for target.
          // If Product=USD (Base) and Target=VES. We need VES Rate.

          let exchangeRate = 1;

          // Case 1: Product is Base (e.g. USD), Target is Foreign (e.g. VES)
          if (productCurrency.isBase || productCurrency.code === "USD") {
            const rateEntry = rates.find(
              (r: any) => r.currencyId === targetCurrency.id,
            );
            if (rateEntry) exchangeRate = Number(rateEntry.rate);
          }
          // Case 2: Product is Foreign (e.g. VES), Target is Base (e.g. USD)
          else if (targetCurrency.isBase || targetCurrency.code === "USD") {
            const rateEntry = rates.find(
              (r: any) => r.currencyId === productCurrency.id,
            );
            if (rateEntry) exchangeRate = 1 / Number(rateEntry.rate);
          }

          item.price = item.price * exchangeRate;
          // Ensure 2 decimals
          item.price = parseFloat(item.price.toFixed(2));
        }
        return item;
      });

      // Determine Global Exchange Rate (Used for the whole order context)
      // We look for the rate of the Target Currency (VES) relative to Base (USD).
      let globalExchangeRate = 1;
      const targetCurrency =
        currencies?.find((c) => c.isBase) ||
        currencies?.find((c) => c.code === "VES");

      if (targetCurrency && rates) {
        const rateEntry = rates.find(
          (r: any) => r.currencyId === targetCurrency.id,
        );
        if (rateEntry) {
          globalExchangeRate = Number(rateEntry.rate);
        }
      }
      processedData.exchangeRate = globalExchangeRate;

      await createOrder.mutateAsync(processedData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  const calculateTotal = () => {
    const items = form.watch("items");
    const total = items.reduce((sum, item) => {
      if (!item.quantity || !item.price) return sum;

      let itemTotal = item.quantity * item.price;

      // Convert to VES for Total Display
      // We rely on item.currencyId stored in form
      const productCurrency = currencies?.find((c) => c.id === item.currencyId);
      const targetCurrency =
        currencies?.find((c) => c.isBase) ||
        currencies?.find((c) => c.code === "VES");

      if (
        productCurrency &&
        targetCurrency &&
        productCurrency.id !== targetCurrency.id &&
        rates
      ) {
        // If Product is USD (likely Base) and Target is VES.
        // We need the rate for VES.
        const rateEntry = rates.find(
          (r: any) => r.currencyId === targetCurrency.id,
        );

        if (rateEntry) {
          // Apply conversion (Original * Rate)
          itemTotal = itemTotal * Number(rateEntry.rate);
        }
      }

      return sum + itemTotal;
    }, 0);
    return total;
  };

  // Helper to get max quantity
  const getMaxQuantity = (index: number) => {
    return form.getValues(`items.${index}.maxQuantity`) || 999999;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
          <DialogDescription>
            Crea un nuevo pedido de venta para un cliente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Cliente</FormLabel>
                    <PartnerCombobox
                      value={field.value}
                      onChange={field.onChange}
                      type="CUSTOMER"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Almacén (Origen)</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Reset items when warehouse changes to avoid invalid products
                        form.setValue("items", [
                          { productId: "", quantity: 1, price: 0 },
                        ]);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar almacén" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses?.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Productos</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ productId: "", quantity: 1, price: 0 })
                  }
                  disabled={!warehouseId}
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                </Button>
              </div>

              {!warehouseId && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  Selecciona un almacén para ver los productos disponibles.
                </div>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 items-end border p-4 rounded-md"
                >
                  <div className="col-span-12 md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={index !== 0 ? "sr-only" : ""}>
                            Producto
                          </FormLabel>
                          <ProductCombobox
                            value={field.value}
                            onChange={field.onChange}
                            mode="STOCK"
                            warehouseId={warehouseId}
                            onSelectObject={(item) => {
                              // Set Price
                              form.setValue(
                                `items.${index}.price`,
                                parseFloat(item.price || "0"),
                              );
                              // Set Currency
                              form.setValue(
                                `items.${index}.currencyId`,
                                item.currencyId,
                              );
                              // Set Max Quantity
                              form.setValue(
                                `items.${index}.maxQuantity`,
                                item.quantity,
                              );
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      rules={{
                        required: "Requerido",
                        validate: (value) => {
                          const productId = form.getValues(
                            `items.${index}.productId`,
                          );
                          if (!productId) return true;
                          const max = getMaxQuantity(index);
                          if (value > max) return `Máximo: ${max}`;
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index !== 0 ? "sr-only" : ""}>
                            Cantidad
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e); // Let react hook form handle value
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {form.getValues(`items.${index}.productId`) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Max: {getMaxQuantity(index)}
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index !== 0 ? "sr-only" : ""}>
                            Price Unit.
                            {(() => {
                              const currencyId = form.watch(
                                `items.${index}.currencyId`,
                              );
                              const currency = currencies?.find(
                                (c) => c.id === currencyId,
                              );
                              return currency ? ` (${currency.symbol})` : "";
                            })()}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t">
              <div className="text-lg font-bold">
                Total Estimado: {formatCurrency(calculateTotal().toFixed(2))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createOrder.isPending}>
                  {createOrder.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear Pedido
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
