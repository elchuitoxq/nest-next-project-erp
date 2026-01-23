import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import { useInventoryMutations, useWarehouses } from "../hooks/use-inventory";
import { useProducts } from "../hooks/use-products";
import {
  inventoryMoveSchema,
  InventoryMoveFormValues,
} from "../schemas/move.schema";
import { useAuthStore } from "@/stores/use-auth-store";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveDialog({ open, onOpenChange }: MoveDialogProps) {
  const { createMove } = useInventoryMutations();
  const { data: warehouses } = useWarehouses();
  const { data: products } = useProducts(); // TODO: Optimize for large lists (async select)

  // Fetch Currencies for display
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies");
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const form = useForm<InventoryMoveFormValues>({
    resolver: zodResolver(inventoryMoveSchema),
    defaultValues: {
      type: "IN",
      note: "",
      lines: [{ productId: "", quantity: 1, cost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const type = form.watch("type");

  const { user } = useAuthStore();

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      form.setValue(`lines.${index}.cost`, Number(product.cost));
    }
  };

  const onSubmit = async (data: InventoryMoveFormValues) => {
    // Inject userId from auth store if available
    await createMove.mutateAsync({ ...data, userId: user?.id });
    form.reset({
      type: "IN",
      note: "",
      lines: [{ productId: "", quantity: 1, cost: 0 }],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento</DialogTitle>
          <DialogDescription>
            Entradas, Salidas, Transferencias y Ajustes de inventario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimiento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IN">
                          Entrada (Compra/Prod)
                        </SelectItem>
                        <SelectItem value="OUT">
                          Salida (Venta/Merma)
                        </SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                        <SelectItem value="ADJUST">Ajuste Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(type === "OUT" || type === "TRANSFER" || type === "ADJUST") && (
                <FormField
                  control={form.control}
                  name="fromWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desde Almacén</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Origen..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses
                            ?.filter((w) => w.isActive)
                            .map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(type === "IN" || type === "TRANSFER") && (
                <FormField
                  control={form.control}
                  name="toWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hacia Almacén</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Destino..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses
                            ?.filter((w) => w.isActive)
                            .map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota / Referencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Factura compra #1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border p-4 rounded-md">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold">Productos</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ productId: "", quantity: 1, cost: 0 })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
                </Button>
              </div>

              {fields.map((field, index) => {
                const currentProductId = form.watch(`lines.${index}.productId`);
                const currentProduct = products?.find(
                  (p) => p.id === currentProductId,
                );
                const currentCurrency = currencies?.find(
                  (c) => c.id === currentProduct?.currencyId,
                );
                const currencySymbol = currentCurrency
                  ? currentCurrency.symbol
                  : "";

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Producto
                            </FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                handleProductChange(index, val);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((p) => {
                                  const currency = currencies?.find(
                                    (c) => c.id === p.currencyId,
                                  );
                                  const symbol = currency
                                    ? currency.symbol
                                    : "??";
                                  return (
                                    <SelectItem key={p.id} value={p.id}>
                                      [{symbol}] {p.sku} - {p.name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Cant.
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.cost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Costo Unit.{" "}
                              {currencySymbol ? `(${currencySymbol})` : ""}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMove.isPending}>
                {createMove.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
