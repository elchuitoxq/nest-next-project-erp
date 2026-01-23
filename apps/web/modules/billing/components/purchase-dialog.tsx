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
import { useCreatePurchase } from "../hooks/use-purchases";
import { PartnerCombobox } from "@/modules/partners/components/partner-combobox";
import { ProductCombobox } from "@/modules/inventory/components/product-combobox";
import { useWarehouses } from "@/modules/inventory/hooks/use-inventory";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { purchaseSchema, PurchaseFormValues } from "../schemas/purchase.schema";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDialog({ open, onOpenChange }: PurchaseDialogProps) {
  const { mutateAsync: createPurchase, isPending } = useCreatePurchase();
  // Partners fetched by combobox now
  const { data: warehouses } = useWarehouses();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema) as Resolver<PurchaseFormValues>,
    defaultValues: {
      partnerId: "",
      currencyId: "",
      invoiceNumber: "",
      date: new Date().toISOString().split("T")[0],
      warehouseId: "",
      items: [{ productId: "", quantity: 1, price: 0, currencyId: "" }],
    },
  });

  // Fetch Currencies
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies");
      return data;
    },
  });

  // Fetch Exchange Rates
  const { data: rates } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies/rates/latest");
      return data;
    },
  });

  // Fetch Products via Combobox

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: PurchaseFormValues) => {
    try {
      // Clean up empty strings for optional UUIDs
      const payload = {
        ...data,
        warehouseId: data.warehouseId || undefined,
        // currencyId is required by schema, so it should be a valid string here.
        items: data.items.map((item) => ({
          ...item,
          currencyId: item.currencyId || undefined,
        })),
      };
      await createPurchase(payload);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  const calculateTotal = () => {
    const items = form.watch("items");
    const selectedCurrencyId = form.watch("currencyId");

    let totalNative = 0;
    let totalVES = 0;

    items.forEach((item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      totalNative += lineTotal;

      // Calculate VES Equivalent
      // If Invoice is already VES, lineTotal is in VES.
      // If Invoice is USD, convert to VES.
      const invoiceCurrency = currencies?.find(
        (c) => c.id === selectedCurrencyId,
      );

      // Find VES Currency
      const vesCurrency =
        currencies?.find((c) => c.isBase) ||
        currencies?.find((c) => c.code === "VES");
      // Actually usually Base is USD and Foreign is VES.
      // If Base is USD, and Rates has VES.

      // Let's assume we want to convert 'lineTotal' (which is in 'invoiceCurrency') to 'VES'.

      if (invoiceCurrency && vesCurrency && rates) {
        if (invoiceCurrency.id === vesCurrency.id) {
          totalVES += lineTotal;
        } else {
          // Convert InvoiceCurrency -> VES
          let exchangeRate = 1;

          // Case 1: Invoice (USD) -> VES (Target)
          if (invoiceCurrency.isBase || invoiceCurrency.code === "USD") {
            const rateEntry = rates.find(
              (r: any) => r.currencyId === vesCurrency.id,
            );
            if (rateEntry) exchangeRate = Number(rateEntry.rate);
          }

          // Case 2: Invoice (Foreign) -> VES (Target)
          // If Invoice is EUR? We don't handle cross-rates yet easily without base.
          // But usually it's USD or VES.

          totalVES += lineTotal * exchangeRate;
        }
      } else {
        totalVES += lineTotal; // Fallback
      }
    });

    return { native: totalNative, ves: totalVES };
  };

  const totals = calculateTotal();
  const selectedCurrencyId = form.watch("currencyId");
  const selectedCurrency = currencies?.find((c) => c.id === selectedCurrencyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Factura de Compra</DialogTitle>
          <DialogDescription>
            Ingrese los detalles de la factura del proveedor.
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
                    <FormLabel>Proveedor</FormLabel>
                    <PartnerCombobox
                      value={field.value}
                      onChange={field.onChange}
                      type="SUPPLIER"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda de Factura</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
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

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nro. Control / Factura</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 000123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Emisión</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Almacén (Recepcion)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional: Ingresar stock" />
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
                    <div className="text-xs text-muted-foreground">
                      Si selecciona un almacén, se creará una entrada de
                      inventario.
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Items de Compra</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ productId: "", quantity: 1, price: 0 })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar Item
                </Button>
              </div>

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
                            mode="GLOBAL"
                            onSelectObject={(item) => {
                              // Logic to convert Product COST to Invoice Currency
                              const cost = parseFloat(item.cost || "0");
                              const productCurrencyId = item.currencyId;
                              const invoiceCurrencyId =
                                form.getValues("currencyId"); // Target

                              if (
                                !invoiceCurrencyId ||
                                !productCurrencyId ||
                                invoiceCurrencyId === productCurrencyId
                              ) {
                                form.setValue(`items.${index}.price`, cost);
                                return;
                              }

                              // Conversion needed
                              // We need rates and currencies
                              const productCurrency = currencies?.find(
                                (c) => c.id === productCurrencyId,
                              );
                              const targetCurrency = currencies?.find(
                                (c) => c.id === invoiceCurrencyId,
                              );

                              if (productCurrency && targetCurrency && rates) {
                                let exchangeRate = 1;

                                // Case 1: Product Cost in Base (USD) -> Invoice in Foreign (VES)
                                if (
                                  productCurrency.isBase ||
                                  productCurrency.code === "USD"
                                ) {
                                  const rateEntry = rates.find(
                                    (r: any) =>
                                      r.currencyId === targetCurrency.id,
                                  );
                                  if (rateEntry)
                                    exchangeRate = Number(rateEntry.rate);
                                }
                                // Case 2: Product Cost in Foreign (VES) -> Invoice in Base (USD)
                                else if (
                                  targetCurrency.isBase ||
                                  targetCurrency.code === "USD"
                                ) {
                                  const rateEntry = rates.find(
                                    (r: any) =>
                                      r.currencyId === productCurrency.id,
                                  );
                                  if (rateEntry)
                                    exchangeRate = 1 / Number(rateEntry.rate);
                                }

                                const convertedCost = cost * exchangeRate;
                                form.setValue(
                                  `items.${index}.price`,
                                  parseFloat(convertedCost.toFixed(2)),
                                );
                              } else {
                                // Fallback
                                form.setValue(`items.${index}.price`, cost);
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index !== 0 ? "sr-only" : ""}>
                            Cantidad
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e)}
                            />
                          </FormControl>
                          <FormMessage />
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
                            Costo Unit. {selectedCurrency?.symbol}
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
              <div className="flex flex-col items-end">
                <div className="text-lg font-bold">
                  Total Factura: {formatCurrency(totals.native.toFixed(2))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar Compra
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
