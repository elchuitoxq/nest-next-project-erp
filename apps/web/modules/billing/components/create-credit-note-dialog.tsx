import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Invoice } from "../types";
import { useCreditNotes } from "../hooks/use-credit-notes";
import {
  useWarehouses,
  Warehouse,
} from "@/modules/inventory/hooks/use-warehouses";
import { formatCurrency } from "@/lib/utils";

interface CreateCreditNoteDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const creditNoteSchema = z.object({
  warehouseId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(0.0001, "Cantidad requerida"),
        maxQuantity: z.number(),
      }),
    )
    .min(1, "Debe seleccionar al menos un producto"),
});

type FormValues = z.infer<typeof creditNoteSchema>;

export function CreateCreditNoteDialog({
  invoice,
  open,
  onOpenChange,
}: CreateCreditNoteDialogProps) {
  const { createCreditNote } = useCreditNotes();
  const { warehouses } = useWarehouses();

  // State for selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      warehouseId: "",
      items: [],
    },
  });

  const onSubmit = (values: FormValues) => {
    // Filter items to only selected ones
    const itemsToReturn = values.items.filter((item) =>
      selectedProductIds.includes(item.productId),
    );

    if (itemsToReturn.length === 0) {
      toast.error("Seleccione al menos un producto para devolver");
      return;
    }

    createCreditNote.mutate(
      {
        invoiceId: invoice.id,
        items: itemsToReturn.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        warehouseId:
          values.warehouseId === "no_return" ? undefined : values.warehouseId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedProductIds([]);
          form.reset();
        },
      },
    );
  };

  const toggleSelect = (productId: string, maxQty: number) => {
    const isAlreadySelected = selectedProductIds.includes(productId);

    if (isAlreadySelected) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
      const currentItems = form.getValues("items");
      form.setValue(
        "items",
        currentItems.filter((i) => i.productId !== productId),
      );
    } else {
      setSelectedProductIds((prev) => [...prev, productId]);
      const currentItems = form.getValues("items");
      // Prevent duplicates if it somehow exists
      if (!currentItems.some((i) => i.productId === productId)) {
        form.setValue("items", [
          ...currentItems,
          { productId, quantity: maxQty, maxQuantity: maxQty },
        ]);
      }
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    const currentItems = form.getValues("items");
    const index = currentItems.findIndex((i) => i.productId === productId);
    if (index >= 0) {
      const item = currentItems[index];
      if (qty > item.maxQuantity) {
        toast.error(`La cantidad máxima es ${item.maxQuantity}`);
        return;
      }
      // Use setValue array method tricky, better to re-set entire array or useFieldArray (too complex for this)
      const newItems = [...currentItems];
      newItems[index] = { ...item, quantity: qty };
      form.setValue("items", newItems);
    }
  };

  // Pre-filter valid warehouses (e.g. active and same branch if enforced)
  // For now show all

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nota de Crédito (Devolución)</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="border rounded-md p-4 bg-muted/20">
              <h3 className="font-medium mb-2">
                1. Seleccionar Almacén de Retorno (Opcional)
              </h3>
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Almacén</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No retornar inventario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_return">
                          No retornar inventario (Solo administrativo)
                        </SelectItem>
                        {warehouses?.map((w) => (
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
            </div>

            <div className="border rounded-md">
              <h3 className="font-medium p-4 border-b">
                2. Seleccionar Productos
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Cant. Orig.</TableHead>
                    <TableHead className="w-[120px]">A Devolver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => {
                    const isSelected = selectedProductIds.includes(
                      item.productId,
                    );
                    const formItem = form
                      .getValues("items")
                      .find((i) => i.productId === item.productId);
                    const currentQty = formItem?.quantity || 0;

                    return (
                      <TableRow
                        key={item.id}
                        data-state={isSelected ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleSelect(
                                item.productId,
                                Number(item.quantity),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>{item.product?.name || "???"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            Number(item.price),
                            invoice.currency?.symbol || "$",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            disabled={!isSelected}
                            value={isSelected ? currentQty : ""}
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                Number(e.target.value),
                              )
                            }
                            max={Number(item.quantity)}
                            min={0}
                            className="h-8 w-24 ml-auto"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createCreditNote.isPending || selectedProductIds.length === 0
                }
              >
                {createCreditNote.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generar Devolución
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
