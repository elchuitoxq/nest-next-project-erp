"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Loader2, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useBankAccounts } from "@/modules/treasury/hooks/use-treasury";
import { useCurrencies } from "@/modules/settings/currencies/hooks/use-currencies";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";

import { motion, AnimatePresence } from "framer-motion";

export default function MethodsPage() {
  const queryClient = useQueryClient();
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    currencyId: "ALL",
    isDigital: false,
  });
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await api.get("/treasury/methods");
      return data;
    },
  });

  const { data: currencies } = useCurrencies();
  const { data: accounts } = useBankAccounts();

  // Client-side filtering
  const filteredMethods =
    methods?.filter((m: any) => {
      const term = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(term) ||
        m.code.toLowerCase().includes(term)
      );
    }) || [];

  const createMutation = useMutation({
    mutationFn: async (vars: any) => {
      const payload = {
        ...vars,
        currencyId: vars.currencyId === "ALL" ? null : vars.currencyId,
      };
      await api.post("/treasury/methods", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setIsCreating(false);
      toast.success("Método creado correctamente");
    },
    onError: () => toast.error("Error al crear método"),
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (vars: { id: string; data: any }) => {
      const payload = {
        ...vars.data,
        currencyId:
          vars.data.currencyId === "ALL" ? null : vars.data.currencyId,
      };
      await api.patch(`/treasury/methods/${vars.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Detalles actualizados");
    },
    onError: () => toast.error("Error al actualizar detalles"),
  });

  const updateAccountsMutation = useMutation({
    mutationFn: async (vars: { id: string; accounts: string[] }) => {
      await api.post(`/treasury/methods/${vars.id}/accounts`, {
        accountIds: vars.accounts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      // We don't close dialog here to allow further editing if needed, or we could.
      toast.success("Cuentas asociadas actualizadas");
    },
    onError: () => toast.error("Error al actualizar cuentas"),
  });

  const handleEdit = (method: any) => {
    setEditingMethod(method);
    setIsCreating(false);
    setFormData({
      name: method.name,
      code: method.code,
      currencyId: method.currencyId || "ALL",
      isDigital: method.isDigital || false,
    });
    // Extract existing IDs
    const existing =
      method.allowedAccounts?.map((a: any) => a.bankAccountId) || [];
    setSelectedAccounts(existing);
  };

  const handleCreateOpen = () => {
    setEditingMethod(null);
    setIsCreating(true);
    setFormData({
      name: "",
      code: "",
      currencyId: "ALL",
      isDigital: false,
    });
    setSelectedAccounts([]);
  };

  const handleToggleAccount = (accId: string) => {
    setSelectedAccounts((prev) => {
      if (prev.includes(accId)) return prev.filter((x) => x !== accId);
      return [...prev, accId];
    });
  };

  const handleSave = async () => {
    if (isCreating) {
      createMutation.mutate(formData);
    } else if (editingMethod) {
      // 1. Update Details
      await updateDetailsMutation.mutateAsync({
        id: editingMethod.id,
        data: formData,
      });
      // 2. Update Accounts
      await updateAccountsMutation.mutateAsync({
        id: editingMethod.id,
        accounts: selectedAccounts,
      });

      setEditingMethod(null);
    }
  };

  // Helper to close
  const closeDialog = () => {
    setEditingMethod(null);
    setIsCreating(false);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb />
        </div>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Métodos de Pago"
          description="Configura métodos, divisas permitidas y cuentas asociadas."
        >
          <Button onClick={handleCreateOpen} className="premium-shadow">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Método
          </Button>
        </PageHeader>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Métodos</CardTitle>
                <CardDescription>
                  Gestiona las opciones de pago disponibles en el sistema.
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar método..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border relative">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center backdrop-blur-[2px]"
                  >
                    <div className="bg-background/80 p-3 rounded-full shadow-lg border">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">Método</TableHead>
                    <TableHead className="px-4">Código</TableHead>
                    <TableHead className="px-4">Divisa Exclusiva</TableHead>
                    <TableHead className="px-4">Tipo</TableHead>
                    <TableHead className="px-4">Cuentas Permitidas</TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (filteredMethods?.length ?? 0) > 0 ? (
                      filteredMethods?.map((m: any, index: number) => (
                        <motion.tr
                          key={m.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="group border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-bold py-3 px-4 text-sm">
                            {m.name}
                          </TableCell>
                          <TableCell className="font-mono-data text-[10px] py-3 px-4 text-primary font-bold">
                            {m.code}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {m.currencyId ? (
                              <Badge variant="outline" className="text-[10px]">
                                {currencies?.find(
                                  (c: any) => c.id === m.currencyId,
                                )?.code || "N/A"}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100"
                              >
                                MULTIDIVISA
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {m.isDigital ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-blue-100 text-blue-700"
                              >
                                Digital
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Físico
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {m.allowedAccounts &&
                              m.allowedAccounts.length > 0 ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/5 text-primary border-primary/10 text-[10px] uppercase font-bold tracking-tighter"
                                >
                                  {m.allowedAccounts.length} asociados
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[10px] italic">
                                  Todas (Sin restricción)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-bold"
                              onClick={() => handleEdit(m)}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-2" /> EDITAR
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TableCell
                          colSpan={6}
                          className="text-center py-20 text-muted-foreground italic"
                        >
                          No se encontraron métodos.
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog
          open={!!editingMethod || isCreating}
          onOpenChange={(o) => !o && closeDialog()}
        >
          <DialogContent className="max-w-lg premium-shadow border-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {isCreating
                  ? "Nuevo Método de Pago"
                  : `Editar: ${editingMethod?.name}`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isCreating
                  ? "Registra un nuevo método de pago en el sistema."
                  : "Modifica los detalles y las cuentas asociadas."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    placeholder="Ej. Transferencia Banesco"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Interno</Label>
                  <Input
                    placeholder="Ej. TRANSF_BANESCO"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, code: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label>Divisa Exclusiva</Label>
                  <Select
                    value={formData.currencyId}
                    onValueChange={(val) =>
                      setFormData((p) => ({ ...p, currencyId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Multidivisa (Todas)</SelectItem>
                      {currencies?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Si seleccionas una, este método solo aparecerá para esa
                    moneda.
                  </p>
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-lg mt-5">
                  <Switch
                    id="digital"
                    checked={formData.isDigital}
                    onCheckedChange={(c) =>
                      setFormData((p) => ({ ...p, isDigital: c }))
                    }
                  />
                  <Label htmlFor="digital" className="cursor-pointer">
                    Es Digital / Electrónico
                  </Label>
                </div>
              </div>

              {!isCreating && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Cuentas Permitidas (Entrada de Dinero)</Label>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Define a qué cuentas puede llegar dinero con este método.
                    </p>
                    <div className="max-h-[150px] overflow-y-auto custom-scrollbar border rounded-md p-2">
                      {accounts
                        ?.filter(
                          (acc) =>
                            formData.currencyId === "ALL" ||
                            acc.currencyId === formData.currencyId,
                        )
                        .map((acc) => (
                          <div
                            key={acc.id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleToggleAccount(acc.id)}
                          >
                            <Checkbox
                              id={acc.id}
                              checked={selectedAccounts.includes(acc.id)}
                              onCheckedChange={() =>
                                handleToggleAccount(acc.id)
                              }
                            />
                            <Label
                              htmlFor={acc.id}
                              className="cursor-pointer flex flex-1 items-center justify-between text-xs font-medium"
                            >
                              {acc.name}
                              <Badge
                                variant="outline"
                                className="ml-2 font-mono-data text-[10px]"
                              >
                                {acc.currency?.code}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={closeDialog}
                className="text-xs font-bold uppercase"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  createMutation.isPending ||
                  updateDetailsMutation.isPending ||
                  updateAccountsMutation.isPending
                }
                className="premium-shadow text-xs font-bold uppercase"
              >
                {(createMutation.isPending ||
                  updateDetailsMutation.isPending ||
                  updateAccountsMutation.isPending) && (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                )}
                {isCreating ? "Crear Método" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </SidebarInset>
  );
}
