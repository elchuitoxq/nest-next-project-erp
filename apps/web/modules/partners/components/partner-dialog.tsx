import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Partner } from "../types";
import { partnerSchema, PartnerFormValues } from "../schemas/partner.schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { usePartnerMutations } from "../hooks/use-partners";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerToEdit?: Partner | null;
}

export function PartnerDialog({
  open,
  onOpenChange,
  partnerToEdit,
}: PartnerDialogProps) {
  const { createPartner, updatePartner } = usePartnerMutations();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      taxId: "",
      address: "",
      phone: "",
      type: "CUSTOMER",
      taxpayerType: "ORDINARY",
      retentionRate: "0",
      isSpecialTaxpayer: false,
      creditLimit: "0",
    },
  });

  // Watch taxpayerType to auto-set retention
  const taxpayerType = form.watch("taxpayerType");

  useEffect(() => {
    if (taxpayerType === "SPECIAL") {
      form.setValue("retentionRate", "75");
      form.setValue("isSpecialTaxpayer", true);
    } else if (taxpayerType === "ORDINARY") {
      // Small fix for types matching if user manually changes
    } else {
      // Ordinary/Formal usually 0
      // Ensure we reset legacy flag if not special
      form.setValue("isSpecialTaxpayer", false);
    }
  }, [taxpayerType, form]);

  useEffect(() => {
    if (partnerToEdit) {
      form.reset({
        name: partnerToEdit.name,
        email: partnerToEdit.email || "",
        taxId: partnerToEdit.taxId,
        address: partnerToEdit.address || "",
        phone: partnerToEdit.phone || "",
        type: partnerToEdit.type,
        taxpayerType: partnerToEdit.taxpayerType || "ORDINARY",
        retentionRate: partnerToEdit.retentionRate?.toString() || "0",
        isSpecialTaxpayer: partnerToEdit.isSpecialTaxpayer,
        creditLimit: partnerToEdit.creditLimit || "0",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        taxId: "",
        address: "",
        phone: "",
        type: "CUSTOMER",
        taxpayerType: "ORDINARY",
        retentionRate: "0",
        isSpecialTaxpayer: false,
        creditLimit: "0",
      });
    }
  }, [partnerToEdit, form, open]);

  const onSubmit = async (values: PartnerFormValues) => {
    try {
      if (partnerToEdit) {
        await updatePartner.mutateAsync({ id: partnerToEdit.id, data: values });
      } else {
        await createPartner.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const isPending = createPartner.isPending || updatePartner.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partnerToEdit ? "Editar Socio" : "Crear Nuevo Socio"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre / Razón Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del socio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RIF/CI</FormLabel>
                    <FormControl>
                      <Input placeholder="V-12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Relación</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Cliente</SelectItem>
                        <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                        <SelectItem value="BOTH">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-md space-y-4 border">
              <h3 className="font-semibold text-sm">Información Fiscal</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxpayerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contribuyente</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ORDINARY">Ordinario</SelectItem>
                          <SelectItem value="SPECIAL">Especial</SelectItem>
                          <SelectItem value="FORMAL">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retentionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Retención IVA</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0% (No aplica)</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="100">100%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección completa" {...field} />
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
                    <Input placeholder="0414-1234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {partnerToEdit ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
