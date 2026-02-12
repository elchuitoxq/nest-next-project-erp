"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  DollarSign,
  TrendingUp,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  useBenefits,
  useBenefitMutations,
  Benefit,
} from "../../hooks/use-benefits";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const benefitSchema = z.object({
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12),
  monthlySalary: z.coerce.number().min(0),
  integralSalary: z.coerce.number().min(0),
  days: z.coerce.number().min(1),
  amount: z.coerce.number().min(0),
  type: z.enum(["REGULAR", "ANTICIPO", "LIQUIDACION"]),
  notes: z.string().optional(),
});

type BenefitFormValues = z.infer<typeof benefitSchema>;

interface BenefitsTabProps {
  employeeId: string;
}

export function BenefitsTab({ employeeId }: BenefitsTabProps) {
  const { data: benefits, isLoading } = useBenefits(employeeId);
  const { createBenefit, updateBenefit, deleteBenefit } = useBenefitMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [benefitToEdit, setBenefitToEdit] = useState<Benefit | undefined>(
    undefined,
  );
  const [benefitToDelete, setBenefitToDelete] = useState<string | null>(null);

  const form = useForm<BenefitFormValues>({
    resolver: zodResolver(benefitSchema) as any,
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      type: "REGULAR",
      days: 15,
    },
  });

  // Reset or populate form
  useEffect(() => {
    if (isCreateOpen) {
      if (benefitToEdit) {
        form.reset({
          year: benefitToEdit.year,
          month: benefitToEdit.month,
          type: benefitToEdit.type,
          days: benefitToEdit.days,
          monthlySalary: Number(benefitToEdit.monthlySalary),
          integralSalary: Number(benefitToEdit.integralSalary),
          amount: Number(benefitToEdit.amount),
          notes: benefitToEdit.notes || "",
        });
      } else {
        form.reset({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          type: "REGULAR",
          days: 15,
          monthlySalary: 0,
          integralSalary: 0,
          amount: 0,
          notes: "",
        });
      }
    }
  }, [isCreateOpen, benefitToEdit, form]);

  const onSubmit = (values: BenefitFormValues) => {
    if (benefitToEdit) {
      updateBenefit.mutate(
        {
          id: benefitToEdit.id,
          data: values,
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setBenefitToEdit(undefined);
            form.reset();
          },
        },
      );
    } else {
      createBenefit.mutate(
        {
          employeeId,
          ...values,
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            form.reset();
          },
        },
      );
    }
  };

  const accumulatedTotal = benefits?.[0]?.accumulatedAmount || "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Acumulado Total
            </p>
            <div className="text-3xl font-bold text-primary flex items-center gap-1">
              <DollarSign className="h-6 w-6" />
              {formatCurrency(Number(accumulatedTotal), "Bs")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Disponible para anticipos (75%)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Historial de Prestaciones</h3>
          <p className="text-sm text-muted-foreground">
            Garantía de prestaciones sociales (Art. 142 LOTTT).
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setBenefitToEdit(undefined);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Registrar Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {benefitToEdit
                  ? "Editar Movimiento"
                  : "Registrar Prestación / Anticipo"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mes</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem
                                key={i + 1}
                                value={(i + 1).toString()}
                              >
                                {format(new Date(2024, i, 1), "MMMM", {
                                  locale: es,
                                })}
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REGULAR">
                              Abono Quincenal/Mensual
                            </SelectItem>
                            <SelectItem value="ANTICIPO">
                              Anticipo (75%)
                            </SelectItem>
                            <SelectItem value="LIQUIDACION">
                              Liquidación Final
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días a Abonar</FormLabel>
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
                    name="monthlySalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salario Mensual</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="integralSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salario Integral</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Total (Bs)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          className="font-bold bg-muted"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createBenefit.isPending || updateBenefit.isPending}
                >
                  {benefitToEdit
                    ? "Actualizar Movimiento"
                    : "Registrar Movimiento"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Salario Integral</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Monto del Periodo</TableHead>
                <TableHead className="text-right">Acumulado</TableHead>
                <TableHead className="text-right w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefits?.map((benefit) => (
                <TableRow key={benefit.id}>
                  <TableCell>
                    {benefit.month}/{benefit.year}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        benefit.type === "ANTICIPO" ? "warning" : "default"
                      }
                    >
                      {benefit.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(Number(benefit.integralSalary), "Bs")}
                  </TableCell>
                  <TableCell>{benefit.days}</TableCell>
                  <TableCell
                    className={cn(
                      "font-medium",
                      benefit.type === "ANTICIPO"
                        ? "text-red-500"
                        : "text-green-600",
                    )}
                  >
                    {benefit.type === "ANTICIPO" ? "-" : "+"}
                    {formatCurrency(Number(benefit.amount), "Bs")}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Number(benefit.accumulatedAmount), "Bs")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setBenefitToEdit(benefit);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setBenefitToDelete(benefit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!benefits?.length && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay movimientos de prestaciones registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!benefitToDelete}
        onOpenChange={(open) => !open && setBenefitToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Registro</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">
                ¿Está seguro de eliminar este registro? Esto afectará los
                cálculos acumulados.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBenefitToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (benefitToDelete) {
                    deleteBenefit.mutate(benefitToDelete, {
                      onSuccess: () => setBenefitToDelete(null),
                    });
                  }
                }}
                disabled={deleteBenefit.isPending}
              >
                {deleteBenefit.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
