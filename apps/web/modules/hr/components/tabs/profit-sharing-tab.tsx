"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { Plus, BadgeDollarSign, Calendar } from "lucide-react";
import {
  useProfitSharing,
  useProfitSharingMutations,
} from "../../hooks/use-profit-sharing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

const profitSharingSchema = z.object({
  year: z.coerce.number().min(2000),
  daysToPay: z.coerce.number().min(1),
  amount: z.coerce.number().min(0.01, "Monto requerido"),
  paymentDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID"]).default("PENDING"),
  notes: z.string().optional(),
});

type ProfitSharingFormValues = z.infer<typeof profitSharingSchema>;

interface ProfitSharingTabProps {
  employeeId: string;
}

export function ProfitSharingTab({ employeeId }: ProfitSharingTabProps) {
  const { data: profitSharings, isLoading } = useProfitSharing(employeeId);
  const { createProfitSharing } = useProfitSharingMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<ProfitSharingFormValues>({
    resolver: zodResolver(profitSharingSchema) as any,
    defaultValues: {
      year: new Date().getFullYear(),
      daysToPay: 30, // Default min legal is 30 days usually
      status: "PENDING",
    },
  });

  const onSubmit = (values: ProfitSharingFormValues) => {
    createProfitSharing.mutate(
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
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: es });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Utilidades (Bono de Fin de Año)
          </h3>
          <p className="text-sm text-muted-foreground">
            Control de pago de beneficios anuales (Art. 131 LOTTT).
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Registrar Utilidades
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Registrar Pago de Utilidades</DialogTitle>
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
                        <FormLabel>Año Fiscal</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="daysToPay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días a Pagar</FormLabel>
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Total</FormLabel>
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
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Pago (Opcional)</FormLabel>
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProfitSharing.isPending}
                >
                  Registrar
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Pagado (Histórico)
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(
                  profitSharings
                    ?.filter((p) => p.status === "PAID")
                    .reduce((acc, p) => acc + Number(p.amount), 0) || 0,
                )}
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
                <TableHead>Días</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha Pago</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitSharings?.map((profit) => (
                <TableRow key={profit.id}>
                  <TableCell className="font-medium">{profit.year}</TableCell>
                  <TableCell>{profit.daysToPay} días</TableCell>
                  <TableCell>{formatCurrency(Number(profit.amount))}</TableCell>
                  <TableCell>{formatDate(profit.paymentDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        profit.status === "PAID" ? "default" : "secondary"
                      }
                    >
                      {profit.status === "PAID" ? "Pagado" : "Pendiente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!profitSharings?.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay registros de utilidades.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
