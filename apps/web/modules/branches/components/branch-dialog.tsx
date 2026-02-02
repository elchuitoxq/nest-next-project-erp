import { useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { useBranchMutations } from "../hooks/use-branch-mutations";
import { Branch } from "../types";
import {
  createBranchSchema,
  CreateBranchFormValues,
} from "../schemas/branch.schema";

interface BranchDialogProps {
  branch?: Branch; // Edit mode if present
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BranchDialog({
  branch,
  open,
  onOpenChange,
}: BranchDialogProps) {
  const isEdit = !!branch;
  const { createBranch, updateBranch } = useBranchMutations();

  const form = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      taxId: "",
      phone: "",
      email: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (branch && open) {
      form.reset({
        name: branch.name,
        address: branch.address || "",
        taxId: branch.taxId || "",
        phone: branch.phone || "",
        email: branch.email || "",
        isActive: branch.isActive,
      });
    } else if (!branch && open) {
      form.reset({
        name: "",
        address: "",
        taxId: "",
        phone: "",
        email: "",
        isActive: true,
      });
    }
  }, [branch, open, form]);

  const onSubmit = async (data: CreateBranchFormValues) => {
    try {
      if (isEdit && branch) {
        await updateBranch.mutateAsync({
          id: branch.id,
          ...data,
        });
      } else {
        await createBranch.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook toast
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la sede aquí."
              : "Ingresa los datos para crear una nueva sede."}
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
                    <Input placeholder="Sede Principal" {...field} />
                  </FormControl>
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
                    <Input
                      placeholder="Av. Bolívar, Edif. Torre..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RIF / Tax ID</FormLabel>
                    <FormControl>
                      <Input placeholder="J-12345678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+58 ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="sucursal@ejemplo.com" {...field} />
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
                    <p className="text-sm text-muted-foreground">
                      Si está desactivado, la sede no aparecerá en selección de
                      operaciones.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={createBranch.isPending || updateBranch.isPending}
              >
                {(createBranch.isPending || updateBranch.isPending) && (
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
