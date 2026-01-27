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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar Nueva Nómina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Frecuencia de Pago</Label>
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
              <Label>Desde</Label>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={generatePayroll.isPending}>
            {generatePayroll.isPending ? "Generando..." : "Generar Borrador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
