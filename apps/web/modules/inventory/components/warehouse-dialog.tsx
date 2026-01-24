import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useWarehouseMutations } from "../hooks/use-inventory";
import { useBranches } from "@/modules/branches/hooks/use-branches";
import { Warehouse } from "@/modules/inventory/types";

const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  branchId: z.string().optional(),
  address: z.string(),
  isActive: z.boolean(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse;
}

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
}: WarehouseDialogProps) {
  const { createWarehouse, updateWarehouse } = useWarehouseMutations();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const isEditing = !!warehouse;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      address: "",
      isActive: true,
      branchId: undefined,
    },
  });

  useEffect(() => {
    if (warehouse) {
      form.reset({
        name: warehouse.name,
        address: warehouse.address || "",
        isActive: warehouse.isActive,
        // @ts-ignore
        branchId: warehouse.branchId || undefined,
      });
    } else {
      if (!open) {
        form.reset({
          name: "",
          address: "",
          isActive: true,
          branchId: undefined,
        });
      }
    }
  }, [warehouse, form, open]);

  const onSubmit = async (data: WarehouseFormValues) => {
    if (isEditing && warehouse) {
      // @ts-ignore
      await updateWarehouse.mutateAsync({
        id: warehouse.id,
        data: {
          ...data,
          branchId: data.branchId || undefined,
          address: data.address || undefined,
        },
      });
    } else {
      await createWarehouse.mutateAsync({
        ...data,
        branchId: data.branchId || undefined,
        address: data.address || undefined,
      });
    }
    form.reset();
    onOpenChange(false);
  };

  const isLoading = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Almacén" : "Nuevo Almacén"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del almacén seleccionado."
              : "Registra una nueva ubicación física para tu inventario."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Almacén Central" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal (Sede)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingBranches}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Zona Industrial..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Activo</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
