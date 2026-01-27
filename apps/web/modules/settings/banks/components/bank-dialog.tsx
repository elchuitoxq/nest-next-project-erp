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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useBankMutations, Bank } from "../hooks/use-banks";

const bankSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  code: z.string().length(4, "El código debe tener 4 dígitos").regex(/^\d+$/, "Solo números"),
});

type BankFormValues = z.infer<typeof bankSchema>;

interface BankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank?: Bank;
}

export function BankDialog({ open, onOpenChange, bank }: BankDialogProps) {
  const { createBank, updateBank } = useBankMutations();

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  useEffect(() => {
    if (bank) {
      form.reset({
        name: bank.name,
        code: bank.code,
      });
    } else {
      form.reset({
        name: "",
        code: "",
      });
    }
  }, [bank, form, open]);

  const onSubmit = async (data: BankFormValues) => {
    try {
      if (bank) {
        await updateBank.mutateAsync({ id: bank.id, data });
      } else {
        await createBank.mutateAsync(data);
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
          <DialogTitle>{bank ? "Editar Banco" : "Nuevo Banco"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Banco</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código SUDEBAN (4 dígitos)</FormLabel>
                  <FormControl>
                    <Input maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
