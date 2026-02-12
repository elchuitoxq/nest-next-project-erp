"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  usePayrollSettings,
  usePayrollSettingsMutation,
} from "../../hooks/use-payroll-settings";
import { Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const settingsSchema = z.object({
  UNIT_TAX_VALUE: z.coerce.number().min(0),
  CESTATICKET_VALUE: z.coerce.number().min(0),
  SSO_EMPLOYEE_PCT: z.coerce.number().min(0).max(1),
  SSO_EMPLOYER_PCT: z.coerce.number().min(0).max(1),
  PIE_EMPLOYEE_PCT: z.coerce.number().min(0).max(1),
  PIE_EMPLOYER_PCT: z.coerce.number().min(0).max(1),
  FAOV_EMPLOYEE_PCT: z.coerce.number().min(0).max(1),
  FAOV_EMPLOYER_PCT: z.coerce.number().min(0).max(1),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function PayrollSettingsTab() {
  const { data: settings, isLoading } = usePayrollSettings();
  const { updateSettings } = usePayrollSettingsMutation();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      UNIT_TAX_VALUE: 0,
      CESTATICKET_VALUE: 0,
      SSO_EMPLOYEE_PCT: 0,
      SSO_EMPLOYER_PCT: 0,
      PIE_EMPLOYEE_PCT: 0,
      PIE_EMPLOYER_PCT: 0,
      FAOV_EMPLOYEE_PCT: 0,
      FAOV_EMPLOYER_PCT: 0,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        UNIT_TAX_VALUE: settings["UNIT_TAX_VALUE"]?.value || 0,
        CESTATICKET_VALUE: settings["CESTATICKET_VALUE"]?.value || 0,
        SSO_EMPLOYEE_PCT: settings["SSO_EMPLOYEE_PCT"]?.value || 0,
        SSO_EMPLOYER_PCT: settings["SSO_EMPLOYER_PCT"]?.value || 0,
        PIE_EMPLOYEE_PCT: settings["PIE_EMPLOYEE_PCT"]?.value || 0,
        PIE_EMPLOYER_PCT: settings["PIE_EMPLOYER_PCT"]?.value || 0,
        FAOV_EMPLOYEE_PCT: settings["FAOV_EMPLOYEE_PCT"]?.value || 0,
        FAOV_EMPLOYER_PCT: settings["FAOV_EMPLOYER_PCT"]?.value || 0,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    const updates = Object.keys(values).map((key) => ({
      key,
      value: values[key as keyof SettingsFormValues],
      // Preserve other fields if needed, but backend handles upsert by key
      label: settings?.[key]?.label || key, // Fallback label
      type: settings?.[key]?.type || "FIXED_VES", // Fallback type
    }));

    updateSettings.mutate(updates as any);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="premium-shadow">
            <CardHeader>
              <CardTitle>Valores Globales</CardTitle>
              <CardDescription>Unidad Tributaria y Cestaticket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="UNIT_TAX_VALUE"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad Tributaria (UT - VES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="CESTATICKET_VALUE"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cestaticket (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="premium-shadow">
            <CardHeader>
              <CardTitle>Retenciones de Ley (IVSS)</CardTitle>
              <CardDescription>
                Porcentajes de cotización Seguro Social
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="SSO_EMPLOYEE_PCT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado (4% = 0.04)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="SSO_EMPLOYER_PCT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrono (Ej. 9% = 0.09)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="premium-shadow">
            <CardHeader>
              <CardTitle>Régimen Prestacional de Empleo (PIE)</CardTitle>
              <CardDescription>Antiguo Paro Forzoso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="PIE_EMPLOYEE_PCT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado (0.5% = 0.005)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="PIE_EMPLOYER_PCT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrono (2% = 0.02)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="premium-shadow">
            <CardHeader>
              <CardTitle>Fondo Ahorro Vivienda (FAOV)</CardTitle>
              <CardDescription>Banavih</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="FAOV_EMPLOYEE_PCT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado (1% = 0.01)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        {...field}
                        className="bg-muted/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="FAOV_EMPLOYER_PCT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrono (2% = 0.02)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSettings.isPending}
            className="premium-shadow"
          >
            {updateSettings.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}
