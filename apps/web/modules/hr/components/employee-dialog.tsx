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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useEmployeeMutations, Employee } from "../hooks/use-employees";
import { employeeSchema, EmployeeFormValues } from "../schemas/hr.schema";
import { useCurrencies } from "@/modules/settings/currencies/hooks/use-currencies";
import { usePositions } from "../hooks/use-positions";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee; // If provided, edit mode
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDialogProps) {
  const { createEmployee, updateEmployee } = useEmployeeMutations();
  const { data: currencies } = useCurrencies();
  const { data: positions } = usePositions();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      identityCard: "",
      email: "",
      phone: "",
      positionId: "",
      salaryCurrencyId: "",
      baseSalary: 0,
      payFrequency: "BIWEEKLY",
      bankName: "",
      accountNumber: "",
      accountType: "CHECKING",
    },
  });

  // Watch position to auto-fill salary suggestion
  const selectedPositionId = form.watch("positionId");

  useEffect(() => {
    if (selectedPositionId && !employee) {
      // Auto-fill logic when creating new employee
      const pos = positions?.find((p) => p.id === selectedPositionId);
      if (pos) {
        if (pos.currencyId) form.setValue("salaryCurrencyId", pos.currencyId);
        if (pos.baseSalaryMin)
          form.setValue("baseSalary", Number(pos.baseSalaryMin));
      }
    }
  }, [selectedPositionId, positions, employee, form]);

  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        identityCard: employee.identityCard,
        email: employee.email || "",
        phone: employee.phone || "",
        positionId: employee.positionId,
        salaryCurrencyId: employee.salaryCurrencyId || "",
        baseSalary: Number(employee.baseSalary),
        payFrequency: (employee.payFrequency as any) || "BIWEEKLY",
        bankName: employee.bankName || "",
        accountNumber: employee.accountNumber || "",
        accountType: (employee.accountType as any) || "CHECKING",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        identityCard: "",
        email: "",
        phone: "",
        positionId: "",
        salaryCurrencyId: "",
        baseSalary: 0,
        payFrequency: "BIWEEKLY",
        bankName: "",
        accountNumber: "",
        accountType: "CHECKING",
      });
    }
  }, [employee, form, open]);

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      if (employee) {
        await updateEmployee.mutateAsync({ id: employee.id, data });
      } else {
        await createEmployee.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Editar Empleado" : "Nuevo Empleado"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="identityCard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula / Documento</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions?.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
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
                name="payFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia de Pago</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 border rounded-md bg-muted/20">
              <h3 className="text-sm font-medium mb-4">Configuración Salarial</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salaryCurrencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda del Salario</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies?.map((curr) => (
                            <SelectItem key={curr.id} value={curr.id}>
                              {curr.code} ({curr.symbol})
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
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salario Base</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="p-4 border rounded-md bg-muted/20">
              <h3 className="text-sm font-medium mb-4">Información Bancaria</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Banesco">Banesco</SelectItem>
                          <SelectItem value="Mercantil">Mercantil</SelectItem>
                          <SelectItem value="Provincial">Provincial</SelectItem>
                          <SelectItem value="Banco de Venezuela">
                            Banco de Venezuela
                          </SelectItem>
                          <SelectItem value="BNC">BNC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cuenta</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CHECKING">Corriente</SelectItem>
                          <SelectItem value="SAVINGS">Ahorro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Cuenta (20 dígitos)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0134..."
                          maxLength={20}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Empleado</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
