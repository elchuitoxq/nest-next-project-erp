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
  currencyId: z.string().min(1, "Seleccione una moneda"),
  warehouseId: z.string().min(1, "Seleccione un almacén"),
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
  type?: "SALE" | "PURCHASE";
}

export function OrderDialog({
  open,
  onOpenChange,
  type = "SALE",
}: OrderDialogProps) {
  const { createOrder } = useOrderMutations();
  const isPurchase = type === "PURCHASE";

  const { data: warehouses } = useWarehouses();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      partnerId: "",
      warehouseId: "",
      currencyId: "", // Default empty (will force selection or default to base)
      items: [{ productId: "", quantity: 1, price: 0 }],
    },
  });

  const warehouseId = form.watch("warehouseId");

  // ... (Queries remain same) ...
  // Fetch Exchange Rates
  const { data: rates } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/currencies/rates/latest");
      return data;
    },
  });

  // Fetch Currencies
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/currencies");
      return data;
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: OrderFormValues) => {
    try {
      const processedData = JSON.parse(JSON.stringify(data));
      processedData.type = type; // Add type to payload

      // Currency Conversion Logic (Fixed)
      // Determine Target Currency based on USER SELECTION, fallback to Base
      let targetCurrency = currencies?.find((c) => c.id === processedData.currencyId);
      
      if (!targetCurrency) {
          targetCurrency = currencies?.find((c) => c.isBase) || currencies?.find((c) => c.code === "VES");
      }

      processedData.items = processedData.items.map((item: any) => {
        if (!item.currencyId) return item;
        const productCurrency = currencies?.find(
          (c) => c.id === item.currencyId,
        );

        // Conversion Logic:
        // Convert FROM ProductCurrency TO TargetCurrency (Order Currency)
        if (
          productCurrency &&
          targetCurrency &&
          productCurrency.id !== targetCurrency.id &&
          rates
        ) {
          let exchangeRate = 1;
          // Case 1: Product is Base (USD) -> Order is Foreign (Multiply)
          if (productCurrency.isBase || productCurrency.code === "USD") {
             const rateEntry = rates.find((r: any) => r.currencyId === targetCurrency.id);
             if (rateEntry) exchangeRate = Number(rateEntry.rate);
          } 
          // Case 2: Order is Base (USD) -> Product is Foreign (Divide)
          else if (targetCurrency.isBase || targetCurrency.code === "USD") {
             const rateEntry = rates.find((r: any) => r.currencyId === productCurrency.id);
             if (rateEntry) exchangeRate = 1 / Number(rateEntry.rate);
          }
          // Case 3: Foreign to Foreign (USD to EUR) -> Cross Rate (Not fully implemented, assuming 1 for now or skip)
          // For now, only Base<->Foreign is critical.
          
          item.price = item.price * exchangeRate;
          item.price = parseFloat(item.price.toFixed(2));
        }
        return item;
      });

      // Global Exchange Rate
      // Store the VES rate for accounting purposes (always relative to USD)
      let globalExchangeRate = 1;
      
      const vesCurrency = currencies?.find(c => c.code === "VES");
      
      if (targetCurrency && rates) {
          if (targetCurrency.isBase || targetCurrency.code === "USD") {
               // USD -> Store VES Rate (e.g. 45.00)
               const rateEntry = rates.find((r: any) => r.currencyId === vesCurrency?.id);
               if (rateEntry) globalExchangeRate = Number(rateEntry.rate);
          } else if (targetCurrency.code === "VES") {
               // VES -> Store 1 (1 Bs = 1 Bs)
               globalExchangeRate = 1;
          } else {
               // Other currencies -> Store their rate relative to base
               const rateEntry = rates.find((r: any) => r.currencyId === targetCurrency.id);
               if (rateEntry) globalExchangeRate = Number(rateEntry.rate);
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
    const selectedCurrencyId = form.watch("currencyId");
    
    // Determine Target Currency based on USER SELECTION
    let targetCurrency = currencies?.find((c) => c.id === selectedCurrencyId);
    if (!targetCurrency) {
       targetCurrency = currencies?.find((c) => c.isBase) || currencies?.find((c) => c.code === "VES");
    }

    return items.reduce((sum, item) => {
      if (!item.quantity || !item.price) return sum;
      let itemPrice = item.price;

      const productCurrency = currencies?.find((c) => c.id === item.currencyId);

      // Conversion Logic (Visual)
      if (
        productCurrency &&
        targetCurrency &&
        productCurrency.id !== targetCurrency.id &&
        rates
      ) {
         let exchangeRate = 1;
          // Case 1: Product Base -> Order Foreign (Multiply)
          if (productCurrency.isBase || productCurrency.code === "USD") {
             const rateEntry = rates.find((r: any) => r.currencyId === targetCurrency.id);
             if (rateEntry) exchangeRate = Number(rateEntry.rate);
          } 
          // Case 2: Order Base -> Product Foreign (Divide)
          else if (targetCurrency.isBase || targetCurrency.code === "USD") {
             const rateEntry = rates.find((r: any) => r.currencyId === productCurrency.id);
             if (rateEntry) exchangeRate = 1 / Number(rateEntry.rate);
          }
          
          itemPrice = itemPrice * exchangeRate;
      }
      
      return sum + (item.quantity * itemPrice);
    }, 0);
  };

  const getMaxQuantity = (index: number) => {
    return form.getValues(`items.${index}.maxQuantity`) || 999999;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isPurchase ? "Nueva Orden de Compra" : "Solicitar Pedido"}
          </DialogTitle>
          <DialogDescription>
            {isPurchase
              ? "Registra una orden de compra a proveedor."
              : "Crea un nuevo pedido de venta para un cliente."}
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
                    <FormLabel>
                      {isPurchase ? "Proveedor" : "Cliente"}
                    </FormLabel>
                    <PartnerCombobox
                      value={field.value}
                      onChange={field.onChange}
                      type={isPurchase ? "SUPPLIER" : "CUSTOMER"}
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
                    <FormLabel>
                      {isPurchase ? "Almacén de Destino" : "Almacén de Origen"}
                    </FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
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

              <FormField
                control={form.control}
                name="currencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda de Transacción</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies?.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.code} ({currency.symbol})
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
                              // Price Selection Logic
                              // Sale: item.price (Retail Price)
                              // Purchase: item.cost (Cost Price) or item.price if cost unknown?
                              // Product DTO usually has cost. Assuming item.cost exists or handled.
                              // If using ProductCombobox STOCK mode, it might return stock item.
                              // Stock item has relation to product.

                              const priceToUse = isPurchase
                                ? parseFloat(item.cost || "0") // Use Cost for Purchase
                                : parseFloat(item.price || "0"); // Use Price for Sale

                              form.setValue(`items.${index}.price`, priceToUse);
                              form.setValue(
                                `items.${index}.currencyId`,
                                item.currencyId,
                              );
                              form.setValue(
                                `items.${index}.maxQuantity`,
                                item.quantity,
                              ); // Stock limit (warn for Purchase?)
                              // Actually for Purchase, stock limit logic is inverted? We are ADDING stock.
                              // Current validation validates Quantity <= MaxQuantity.
                              // If Purchase, we shouldn't limit, or limit to infinity.
                              if (isPurchase) {
                                form.setValue(
                                  `items.${index}.maxQuantity`,
                                  999999,
                                );
                              }
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
                          // Only validate max if SALE
                          if (!isPurchase && value > max)
                            return `Máximo: ${max}`;
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
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                          {!isPurchase &&
                            form.getValues(`items.${index}.productId`) && (
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
                            {isPurchase ? "Costo Unit." : "Precio Unit."}
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
                Total Estimado: {(() => {
                    const selectedId = form.watch("currencyId");
                    const currency = currencies?.find(c => c.id === selectedId) || currencies?.find(c => c.isBase);
                    return formatCurrency(calculateTotal().toFixed(2), currency?.code);
                })()}
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
                  {isPurchase ? "Registrar Orden" : "Solicitar Pedido"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
