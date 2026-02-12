"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
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
  Palmtree,
  Calendar,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  useVacations,
  useVacationMutations,
  Vacation,
} from "../../hooks/use-vacations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const vacationSchema = z.object({
  year: z.coerce.number().min(2000),
  totalDays: z.coerce.number().min(1),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().min(1, "Fecha de fin requerida"),
  returnDate: z.string().min(1, "Fecha de retorno requerida"),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type VacationFormValues = z.infer<typeof vacationSchema>;

interface VacationsTabProps {
  employeeId: string;
}

export function VacationsTab({ employeeId }: VacationsTabProps) {
  const { data: vacations, isLoading } = useVacations(employeeId);
  const { createVacation, updateVacation, deleteVacation } =
    useVacationMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [vacationToEdit, setVacationToEdit] = useState<Vacation | undefined>(
    undefined,
  );
  const [vacationToDelete, setVacationToDelete] = useState<string | null>(null);

  // Default logic: start tomorrow, 15 days duration
  const defaultStartDate = addDays(new Date(), 1).toISOString().split("T")[0];

  const form = useForm<VacationFormValues>({
    resolver: zodResolver(vacationSchema) as any,
    defaultValues: {
      year: new Date().getFullYear(),
      totalDays: 15,
      startDate: defaultStartDate,
    },
  });

  useEffect(() => {
    if (isCreateOpen) {
      if (vacationToEdit) {
        form.reset({
          year: vacationToEdit.year,
          totalDays: vacationToEdit.totalDays,
          startDate: vacationToEdit.startDate.split("T")[0],
          endDate: vacationToEdit.endDate.split("T")[0],
          returnDate: vacationToEdit.returnDate.split("T")[0],
          amount: vacationToEdit.amount
            ? Number(vacationToEdit.amount)
            : undefined,
          notes: vacationToEdit.notes || "",
        });
      } else {
        form.reset({
          year: new Date().getFullYear(),
          totalDays: 15,
          startDate: defaultStartDate,
          endDate: "",
          returnDate: "",
          amount: undefined,
          notes: "",
        });
      }
    }
  }, [isCreateOpen, vacationToEdit, form, defaultStartDate]);

  const onSubmit = (values: VacationFormValues) => {
    if (vacationToEdit) {
      updateVacation.mutate(
        {
          id: vacationToEdit.id,
          data: values,
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setVacationToEdit(undefined);
            form.reset();
          },
        },
      );
    } else {
      createVacation.mutate(
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

  const formatDate = (date: string) =>
    format(new Date(date), "dd/MM/yyyy", { locale: es });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Control de Vacaciones</h3>
          <p className="text-sm text-muted-foreground">
            Administración de días de disfrute y bonos vacacionales (Art. 190
            LOTTT).
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setVacationToEdit(undefined);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Registrar Vacaciones
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {vacationToEdit
                  ? "Editar Periodo Vacacional"
                  : "Registrar Periodo Vacacional"}
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
                        <FormLabel>Año Correspondiente</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días a Disfrutar</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="returnDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retorno</FormLabel>
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bono Vacacional (Opcional)</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          {...field}
                        />
                      </div>
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
                  disabled={
                    createVacation.isPending || updateVacation.isPending
                  }
                >
                  {vacationToEdit ? "Actualizar" : "Registrar"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Palmtree className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Días Disfrutados
              </p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {vacations?.reduce((acc, v) => acc + (v.daysTaken || 0), 0) ||
                  0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Año</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacations?.map((vacation) => (
                <TableRow key={vacation.id}>
                  <TableCell className="font-medium">{vacation.year}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>Desde: {formatDate(vacation.startDate)}</span>
                      <span className="text-muted-foreground">
                        Hasta: {formatDate(vacation.endDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{vacation.totalDays}</TableCell>
                  <TableCell>{formatDate(vacation.returnDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vacation.status === "TAKEN" ? "default" : "secondary"
                      }
                    >
                      {vacation.status === "TAKEN"
                        ? "Disfrutadas"
                        : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setVacationToEdit(vacation);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setVacationToDelete(vacation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!vacations?.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay registros de vacaciones.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!vacationToDelete}
        onOpenChange={(open) => !open && setVacationToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Registro</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">
                ¿Está seguro de eliminar este registro de vacaciones?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setVacationToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (vacationToDelete) {
                    deleteVacation.mutate(vacationToDelete, {
                      onSuccess: () => setVacationToDelete(null),
                    });
                  }
                }}
                disabled={deleteVacation.isPending}
              >
                {deleteVacation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
