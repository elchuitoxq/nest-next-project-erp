"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIncidents, useIncidentsMutation } from "../../hooks/use-incidents";
import { usePayrollConceptTypes } from "../../hooks/use-payroll-settings";

const incidentSchema = z.object({
  conceptId: z.string().min(1, "Seleccione un concepto"),
  date: z.string().min(1, "Fecha requerida"),
  quantity: z.coerce.number().min(0).optional(),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

export function IncidentsTab({ employeeId }: { employeeId: string }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: incidents, isLoading } = useIncidents(employeeId);
  const { data: concepts } = usePayrollConceptTypes();
  const { createIncident, deleteIncident } = useIncidentsMutation(employeeId);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      quantity: 1,
    },
  });

  const onSubmit = (values: IncidentFormValues) => {
    createIncident.mutate(
      { ...values, employeeId },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          form.reset({
            date: new Date().toISOString().split("T")[0],
            quantity: 1,
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Novedades e Incidencias</CardTitle>
            <CardDescription>
              Registro de horas extra, bonos, faltas y otras variaciones.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Novedad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Novedad</DialogTitle>
                <DialogDescription>
                  Agregue una incidencia puntual para la próxima nómina.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="conceptId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concepto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione concepto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {concepts?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} (
                                {c.category === "INCOME"
                                  ? "Asignación"
                                  : "Deducción"}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad (Horas/Días)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto Fijo (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Auto"
                              {...field}
                            />
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
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createIncident.isPending}>
                      {createIncident.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!incidents?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay novedades registradas recientemente.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      {format(new Date(incident.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {incident.concept?.name || "Desconocido"}
                    </TableCell>
                    <TableCell>{incident.quantity}</TableCell>
                    <TableCell>
                      {incident.amount ? `$${incident.amount}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          incident.status === "PENDING"
                            ? "outline"
                            : incident.status === "PROCESSED"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {incident.status === "PENDING"
                          ? "Pendiente"
                          : incident.status === "PROCESSED"
                            ? "Procesado"
                            : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={incident.notes || ""}
                    >
                      {incident.notes}
                    </TableCell>
                    <TableCell>
                      {incident.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("¿Eliminar esta novedad?"))
                              deleteIncident.mutate(incident.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
