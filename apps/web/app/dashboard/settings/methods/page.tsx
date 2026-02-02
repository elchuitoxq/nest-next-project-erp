"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/settings">
                  Configuración
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Métodos de Pago</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="p-4 pt-0 space-y-4">
        <div className="py-4">
          <h2 className="text-3xl font-bold tracking-tight">Métodos de Pago</h2>
          <p className="text-muted-foreground">
            Configura qué cuentas bancarias pueden recibir fondos por cada
            método.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Métodos</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Define restricciones operativas para evitar errores en caja.
              </CardDescription>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar método..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Método</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Cuentas Permitidas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMethods?.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {m.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {m.allowedAccounts && m.allowedAccounts.length > 0 ? (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                              {m.allowedAccounts.length} cuentas asociadas
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">
                              Todas (Sin restricción)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(m)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" /> Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMethods?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No se encontraron métodos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={!!editingMethod}
          onOpenChange={(o) => !o && setEditingMethod(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar: {editingMethod?.name}</DialogTitle>
              <DialogDescription>
                Selecciona las cuentas bancarias donde este método puede
                depositar fondos. Si no seleccionas ninguna, se permitirán todas
                (filtradas por moneda).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto border rounded p-2">
              {accounts?.map((acc) => (
                <div key={acc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={acc.id}
                    checked={selectedAccounts.includes(acc.id)}
                    onCheckedChange={() => handleToggleAccount(acc.id)}
                  />
                  <Label htmlFor={acc.id} className="cursor-pointer">
                    {acc.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({acc.currency?.code})
                    </span>
                  </Label>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMethod(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
}
