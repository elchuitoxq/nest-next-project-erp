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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { usePayrollConceptMutations } from "../hooks/use-payroll-concepts";

interface ConceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConceptDialog({ open, onOpenChange }: ConceptDialogProps) {
  const { createConcept } = usePayrollConceptMutations();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("INCOME");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConcept.mutateAsync({ name, code, category });
    onOpenChange(false);
    setName("");
    setCode("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Concepto de Nómina</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Bono de Asistencia"
            />
          </div>
          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="BONO_ASIST"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Asignación (Suma)</SelectItem>
                <SelectItem value="DEDUCTION">Deducción (Resta)</SelectItem>
              </SelectContent>
            </Select>
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
              Guardar Concepto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
