"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { usePositionMutations, JobPosition } from "../hooks/use-positions";
import { positionSchema, PositionFormValues } from "../schemas/hr.schema";
import { useCurrencies } from "@/modules/settings/currencies/hooks/use-currencies";
import { GuideHint } from "@/components/guide/guide-hint";

interface PositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: JobPosition; // If provided, edit mode
}

export function PositionDialog({
  open,
  onOpenChange,
  position,
}: PositionDialogProps) {
  const { createPosition, updatePosition } = usePositionMutations();
  const { data: currencies } = useCurrencies();

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      currencyId: "",
      baseSalaryMin: 0,
      baseSalaryMax: 0,
    },
  });

  useEffect(() => {
    if (position) {
      form.reset({
        name: position.name,
        description: position.description || "",
        currencyId: position.currencyId || "",
        baseSalaryMin: Number(position.baseSalaryMin || 0),
        baseSalaryMax: Number(position.baseSalaryMax || 0),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        currencyId: "",
        baseSalaryMin: 0,
        baseSalaryMax: 0,
      });
    }
  }, [position, form, open]);

  const onSubmit = async (data: PositionFormValues) => {
    try {
      if (position) {
        await updatePosition.mutateAsync({ id: position.id, data });
      } else {
        await createPosition.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{position ? "Editar Cargo" : "Nuevo Cargo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Vendedor Senior" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Responsabilidades..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Moneda Referencia
                      <GuideHint text="Define en qué divisa se expresa el tabulador (lo usual es USD para indexación)." />
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies?.map((curr) => (
                          <SelectItem key={curr.id} value={curr.id}>
                            {curr.code} ({curr.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseSalaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Salario Min (Ref)
                      <GuideHint text="Piso de la banda salarial para este cargo." />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseSalaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Salario Max (Ref)
                      <GuideHint text="Techo de la banda salarial para este cargo." />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
