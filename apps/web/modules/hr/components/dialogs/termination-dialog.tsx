"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  useTerminations,
  TerminationCalculation,
} from "../../hooks/use-terminations";
import { Loader2, AlertTriangle, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const terminationSchema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  reason: z.enum([
    "RESIGNATION",
    "DISMISSAL_JUSTIFIED",
    "DISMISSAL_UNJUSTIFIED",
    "CONTRACT_END",
  ]),
  notes: z.string().optional(),
});

type TerminationFormValues = z.infer<typeof terminationSchema>;

interface TerminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

export function TerminationDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: TerminationDialogProps) {
  const { calculateTermination, executeTermination } = useTerminations();
  const [calculation, setCalculation] = useState<TerminationCalculation | null>(
    null,
  );

  const form = useForm<TerminationFormValues>({
    resolver: zodResolver(terminationSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      reason: "RESIGNATION",
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCalculation(null);
      form.reset();
    }
  }, [open, form]);

  const handleCalculate = async () => {
    const values = form.getValues();
    if (!values.date || !values.reason) {
      form.trigger();
      return;
    }

    const result = await calculateTermination.mutateAsync({
      employeeId,
      date: values.date,
      reason: values.reason,
    });
    setCalculation(result);
  };

  const handleExecute = async () => {
    const values = form.getValues();
    await executeTermination.mutateAsync({
      employeeId,
      date: values.date,
      reason: values.reason,
      notes: values.notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Terminar Relación Laboral
          </DialogTitle>
          <DialogDescription>
            Empleado: <strong>{employeeName}</strong>
            <br />
            Esta acción finalizará el contrato activo y calculará la
            liquidación.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Terminación</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de Salida</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RESIGNATION">
                        Renuncia Voluntaria
                      </SelectItem>
                      <SelectItem value="DISMISSAL_JUSTIFIED">
                        Despido Justificado
                      </SelectItem>
                      <SelectItem value="DISMISSAL_UNJUSTIFIED">
                        Despido Injustificado
                      </SelectItem>
                      <SelectItem value="CONTRACT_END">
                        Fin de Contrato
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / Comentarios</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!calculation ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full mt-2"
                onClick={handleCalculate}
                disabled={calculateTermination.isPending}
              >
                {calculateTermination.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Calcular Liquidación
              </Button>
            ) : (
              <div className="bg-muted p-4 rounded-md space-y-2 mt-4 border border-input">
                <h4 className="font-semibold text-sm">
                  Resumen de Liquidación
                </h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Antigüedad ({calculation.calculation.tenureYears} años):
                    </span>
                    <span>
                      {formatCurrency(
                        parseFloat(calculation.calculation.accumulatedBenefits),
                        calculation.calculation.currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Vacaciones ({calculation.calculation.vacationPending.days}{" "}
                      días):
                    </span>
                    <span>
                      {formatCurrency(
                        parseFloat(
                          calculation.calculation.vacationPending.amount,
                        ),
                        calculation.calculation.currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Utilidades (
                      {calculation.calculation.profitSharingPending.days} días):
                    </span>
                    <span>
                      {formatCurrency(
                        parseFloat(
                          calculation.calculation.profitSharingPending.amount,
                        ),
                        calculation.calculation.currency,
                      )}
                    </span>
                  </div>
                  {/* Show double indemnity if applicable */}
                  {parseFloat(calculation.calculation.doubleIndemnity) > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Indemnización (Doble):</span>
                      <span>
                        {formatCurrency(
                          parseFloat(calculation.calculation.doubleIndemnity),
                          calculation.calculation.currency,
                        )}
                      </span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total a Pagar:</span>
                    <span>
                      {formatCurrency(
                        parseFloat(calculation.calculation.total),
                        calculation.calculation.currency,
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCalculation(null)}
                  >
                    Recalcular
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Form>

        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={executeTermination.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleExecute}
            disabled={!calculation || executeTermination.isPending}
          >
            {executeTermination.isPending ? "Procesando..." : "Confirmar Baja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
