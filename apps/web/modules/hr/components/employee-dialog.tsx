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
import { useBanks } from "@/modules/settings/banks/hooks/use-banks";

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
  const { data: banks } = useBanks();

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
      paymentMethod: "BANK_TRANSFER",
      bankId: "",
      accountNumber: "",
      accountType: "CHECKING",
    },
  });

  // Watch position to auto-fill salary suggestion
  const selectedPositionId = form.watch("positionId");
  const selectedPaymentMethod = form.watch("paymentMethod");

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
        paymentMethod: (employee.paymentMethod as any) || "BANK_TRANSFER",
        bankId: employee.bankId || "",
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
        paymentMethod: "BANK_TRANSFER",
        bankId: "",
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
              <h3 className="text-sm font-medium mb-4">Información de Pago</h3>
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Método de Pago</FormLabel>
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
                        <SelectItem value="BANK_TRANSFER">Transferencia Bancaria</SelectItem>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="MOBILE_PAYMENT">Pago Móvil</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedPaymentMethod === "BANK_TRANSFER" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankId"
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
                            {banks?.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id}>
                                {bank.name} ({bank.code})
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
                  <div className="col-span-2 mt-2">
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
              )}
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
