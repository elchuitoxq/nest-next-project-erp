"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContractType,
  useContractMutations,
  Contract,
} from "../../hooks/use-contracts";

const contractSchema = z.object({
  type: z.nativeEnum(ContractType),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().optional(),
  trialPeriodEnd: z.string().optional(),
  weeklyHours: z.coerce.number().min(1, "Mínimo 1 hora").max(168),
  notes: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName?: string;
  contract?: Contract; // Contract to edit
  onSuccess?: () => void;
}

export function ContractDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  contract,
  onSuccess,
}: ContractDialogProps) {
  const { createContract, updateContract } = useContractMutations();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: {
      type: ContractType.INDEFINIDO,
      startDate: new Date().toISOString().split("T")[0],
      weeklyHours: 40,
    },
  });

  // Reset or populate form
  useEffect(() => {
    if (open) {
      if (contract) {
        form.reset({
          type: contract.type,
          startDate: contract.startDate
            ? new Date(contract.startDate).toISOString().split("T")[0]
            : "",
          endDate: contract.endDate
            ? new Date(contract.endDate).toISOString().split("T")[0]
            : undefined,
          trialPeriodEnd: contract.trialPeriodEnd
            ? new Date(contract.trialPeriodEnd).toISOString().split("T")[0]
            : undefined,
          weeklyHours: contract.weeklyHours || 40,
          notes: contract.notes || "",
        });
      } else {
        form.reset({
          type: ContractType.INDEFINIDO,
          startDate: new Date().toISOString().split("T")[0],
          weeklyHours: 40,
          endDate: undefined,
          trialPeriodEnd: undefined,
          notes: "",
        });
      }
    }
  }, [open, contract, form]);

  const onSubmit = (values: ContractFormValues) => {
    if (contract) {
      updateContract.mutate(
        {
          id: contract.id,
          data: values,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
            onSuccess?.();
          },
        },
      );
    } else {
      createContract.mutate(
        {
          employeeId,
          ...values,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
            onSuccess?.();
          },
        },
      );
    }
  };

  const isPending = createContract.isPending || updateContract.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {contract ? "Editar Contrato" : "Registrar Nuevo Contrato"}{" "}
            {employeeName ? `- ${employeeName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ContractType.INDEFINIDO}>
                        Tiempo Indeterminado
                      </SelectItem>
                      <SelectItem value={ContractType.DETERMINADO}>
                        Tiempo Determinado
                      </SelectItem>
                      <SelectItem value={ContractType.OBRA}>
                        Obra o Labor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weeklyHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Semanales</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trialPeriodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin Período Prueba</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? "Procesando..."
                : contract
                  ? "Actualizar Contrato"
                  : "Guardar Contrato"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
