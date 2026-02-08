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
// Removed useProducts hook usage
import {
  inventoryMoveSchema,
  InventoryMoveFormValues,
} from "../schemas/move.schema";
import { useAuthStore } from "@/stores/use-auth-store";
import { ProductCombobox } from "./product-combobox";
import { GuideCard } from "@/components/guide/guide-card";
import { GuideHint } from "@/components/guide/guide-hint";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveDialog({ open, onOpenChange }: MoveDialogProps) {
  const { createMove } = useInventoryMutations();
  const { data: warehouses } = useWarehouses();
  // products fetch removed

  // Fetch Currencies for display
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/currencies");
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const form = useForm<InventoryMoveFormValues>({
    resolver: zodResolver(inventoryMoveSchema) as any,
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
  const fromWarehouseId = form.watch("fromWarehouseId");

  const { user } = useAuthStore();

  // handleProductChange removed, logic moved to onSelectObject

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
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento</DialogTitle>
          <DialogDescription>
            Entradas, Salidas, Transferencias y Ajustes de inventario.
          </DialogDescription>
        </DialogHeader>

        <GuideCard
          title="Tipos de Movimiento de Inventario"
          variant="info"
          className="mx-4 mt-2"
        >
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Entrada (Compra):</strong> Aumenta stock y recalcula el
              Costo Promedio Ponderado.
            </li>
            <li>
              <strong>Ajuste (Entrada/Salida):</strong> Corrige diferencias de
              stock sin afectar costos de compra (Gasto/Ingreso).
            </li>
            <li>
              <strong>Transferencia:</strong> Mueve mercancía entre depósitos
              sin impacto contable neto.
            </li>
          </ul>
        </GuideCard>
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
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border p-4 sm:p-0 sm:border-0 rounded-md bg-muted/20 sm:bg-transparent"
                  >
                    <div className="col-span-1 sm:col-span-6">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel
                              className={index !== 0 ? "sm:sr-only" : ""}
                            >
                              Producto
                            </FormLabel>
                            <ProductCombobox
                              value={field.value}
                              onChange={field.onChange}
                              mode={
                                type === "OUT" || type === "TRANSFER"
                                  ? "STOCK"
                                  : "GLOBAL"
                              }
                              warehouseId={fromWarehouseId}
                              onSelectObject={(item) => {
                                const cost = Number(item.cost || 0);
                                form.setValue(`lines.${index}.cost`, cost);
                              }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-5">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              className={index !== 0 ? "sm:sr-only" : ""}
                            >
                              Cant.
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${index}.cost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              className={index !== 0 ? "sm:sr-only" : ""}
                            >
                              Costo
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
                disabled={createMove.isPending}
                className="w-full sm:w-auto px-8"
              >
                {createMove.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
