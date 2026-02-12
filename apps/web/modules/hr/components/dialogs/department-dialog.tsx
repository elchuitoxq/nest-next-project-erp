"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import {
  useDepartmentMutations,
  useDepartments,
  Department,
} from "../../hooks/use-departments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/use-auth-store";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  parentId: z.string().optional(),
});

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentToEdit?: Department | null;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  departmentToEdit,
}: DepartmentDialogProps) {
  const { createDepartment, updateDepartment } = useDepartmentMutations();
  const { currentBranch } = useAuthStore();
  const { data: departments } = useDepartments(currentBranch?.id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parentId: "NONE",
    },
  });

  useEffect(() => {
    if (departmentToEdit) {
      form.reset({
        name: departmentToEdit.name,
        parentId: departmentToEdit.parentId || "NONE",
      });
    } else {
      form.reset({
        name: "",
        parentId: "NONE",
      });
    }
  }, [departmentToEdit, open, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentBranch) return;

    const payload = {
      name: values.name,
      branchId: currentBranch.id,
      parentId: values.parentId === "NONE" ? undefined : values.parentId,
    };

    if (departmentToEdit) {
      updateDepartment.mutate(
        { id: departmentToEdit.id, data: payload },
        { onSettled: () => onOpenChange(false) },
      );
    } else {
      createDepartment.mutate(payload, {
        onSettled: () => onOpenChange(false),
      });
    }
  };

  // Filter out the department itself from parent options (prevent basic cyclic selection)
  const validParents =
    departments?.filter((d) => d.id !== departmentToEdit?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {departmentToEdit ? "Editar Departamento" : "Nuevo Departamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Ventas, Logística..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento Padre (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">
                        -- Sin departamento padre --
                      </SelectItem>
                      {validParents.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={
                createDepartment.isPending || updateDepartment.isPending
              }
            >
              {departmentToEdit ? "Guardar Cambios" : "Crear Departamento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
