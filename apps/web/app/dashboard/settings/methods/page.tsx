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
import { Edit2, Loader2, Save } from "lucide-react";
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

import { Input } from "@/components/ui/input";

import { motion, AnimatePresence } from "framer-motion";

export default function MethodsPage() {
  const queryClient = useQueryClient();
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await api.get("/treasury/methods");
      return data;
    },
  });

  // Client-side filtering
  const filteredMethods =
    methods?.filter((m: any) => {
      const term = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(term) ||
        m.code.toLowerCase().includes(term)
      );
    }) || [];

  const { data: accounts } = useBankAccounts();

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; accounts: string[] }) => {
      await api.post(`/treasury/methods/${vars.id}/accounts`, {
        accountIds: vars.accounts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setEditingMethod(null);
      toast.success("Cuentas asociadas actualizadas");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const handleEdit = (method: any) => {
    setEditingMethod(method);
    // Extract existing IDs from allowedAccounts relation
    const existing =
      method.allowedAccounts?.map((a: any) => a.bankAccountId) || [];
    setSelectedAccounts(existing);
  };

  const handleToggleAccount = (accId: string) => {
    setSelectedAccounts((prev) => {
      if (prev.includes(accId)) return prev.filter((x) => x !== accId);
      return [...prev, accId];
    });
  };

  const handleSave = () => {
    if (editingMethod) {
      updateMutation.mutate({
        id: editingMethod.id,
        accounts: selectedAccounts,
      });
    }
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
        <div className="py-4">
          <h2 className="text-3xl font-bold tracking-tight">Métodos de Pago</h2>
          <p className="text-muted-foreground">
            Configura qué cuentas bancarias pueden recibir fondos por cada
            método.
          </p>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Métodos</CardTitle>
                <CardDescription>
                  Define restricciones operativas para evitar errores en caja.
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
                              <Edit2 className="h-3.5 w-3.5 mr-2" /> CONFIGURAR
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
                          colSpan={4}
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

        <Dialog
          open={!!editingMethod}
          onOpenChange={(o) => !o && setEditingMethod(null)}
        >
          <DialogContent className="max-w-md premium-shadow border-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Configurar: {editingMethod?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Selecciona las cuentas bancarias donde este método puede
                depositar fondos. Si no seleccionas ninguna, se permitirán
                todas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {accounts?.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleAccount(acc.id)}
                >
                  <Checkbox
                    id={acc.id}
                    checked={selectedAccounts.includes(acc.id)}
                    onCheckedChange={() => handleToggleAccount(acc.id)}
                  />
                  <Label
                    htmlFor={acc.id}
                    className="cursor-pointer flex flex-1 items-center justify-between text-sm font-medium"
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

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setEditingMethod(null)}
                className="text-xs font-bold uppercase"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="premium-shadow text-xs font-bold uppercase"
              >
                {updateMutation.isPending && (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </SidebarInset>
  );
}
