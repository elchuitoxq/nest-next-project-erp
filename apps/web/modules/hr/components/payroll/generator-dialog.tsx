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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { usePayrollMutations } from "../../hooks/use-payroll";
import { Label } from "@/components/ui/label";
import { GuideHint } from "@/components/guide/guide-hint";

interface GeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayrollGeneratorDialog({ open, onOpenChange }: GeneratorProps) {
  const { generatePayroll } = usePayrollMutations();
  const [frequency, setFrequency] = useState("BIWEEKLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;

    await generatePayroll.mutateAsync({
      startDate,
      endDate,
      frequency,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Nueva Nómina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Frecuencia de Pago
              <GuideHint text="Determina el periodo de cálculo para deducciones y asignaciones fijas." />
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="MONTHLY">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Desde
                <GuideHint text="Fecha de inicio del periodo fiscal." />
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={generatePayroll.isPending}
            className="w-full sm:w-auto px-8"
          >
            {generatePayroll.isPending ? "Generando..." : "Generar Borrador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
