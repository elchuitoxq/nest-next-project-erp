"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { GuideHint } from "@/components/guide/guide-hint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useIncidentMutations } from "../hooks/use-incidents";
import { useEmployees } from "../../hooks/use-employees";
import { usePayrollConcepts } from "../../concepts/hooks/use-payroll-concepts";
import { EmployeeCombobox } from "../../components/shared/employee-combobox";

interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentDialog({ open, onOpenChange }: IncidentDialogProps) {
  const { createIncident } = useIncidentMutations();
  const { data: employees } = useEmployees("ACTIVE");
  const { data: concepts } = usePayrollConcepts();

  const [employeeId, setEmployeeId] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createIncident.mutateAsync({
      employeeId,
      conceptId,
      date,
      amount: Number(amount),
      notes,
    });
    onOpenChange(false);
    // Reset form
    setEmployeeId("");
    setConceptId("");
    setAmount("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Novedad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Empleado</Label>
            <EmployeeCombobox value={employeeId} onChange={setEmployeeId} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Concepto
              <GuideHint text="Seleccione el tipo de incidencia (Ej. Bono de Productividad, Descuento por Préstamo)." />
            </Label>
            <Select value={conceptId} onValueChange={setConceptId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {concepts?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.category === "INCOME" ? "+" : "-"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Fecha
                <GuideHint text="Día en que ocurrió la novedad. Debe estar dentro del periodo de nómina." />
              </Label>
              <DatePicker
                value={date}
                onChange={(v) => setDate(v)}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div className="space-y-2">
              <Label>Monto / Valor Total</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Nota
              <GuideHint text="Detalle justificativo (Ej. 'Aprobado por Gerencia'). Visible en el recibo de pago." />
            </Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto px-8"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto px-8">
              Guardar Novedad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
