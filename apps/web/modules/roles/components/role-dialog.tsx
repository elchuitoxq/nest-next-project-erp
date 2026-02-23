"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: any; // If null, creating new role
  onClose: () => void;
}

import { ALL_PERMISSIONS } from "@repo/db/permissions";

// ... (inside component)

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onClose,
}: RoleDialogProps) {
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Reset form when role changes
  useEffect(() => {
    setTimeout(() => {
      if (role) {
        setName(role.name);
        // Map existing role permissions (which are objects) to codes
        if (role.permissions) {
          setSelectedPermissions(role.permissions.map((p: any) => p.code));
        }
      } else {
        setName("");
        setSelectedPermissions([]);
      }
    }, 0);
  }, [role, open]);

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Create Role
      const res = await api.post<any>("/roles", { name: data.name });
      const newRole = res.data;
      // 2. Assign Permissions (sending CODES now)
      if (data.permissions.length > 0) {
        await api.post(`/roles/${newRole.id}/permissions`, {
          permissionIds: data.permissions, // We will still call it permissionIds in DTO but send codes
        });
      }
      return newRole;
    },
    onSuccess: () => {
      toast.success("Rol creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al crear rol");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      // 2. Update Permissions (sending CODES now)
      await api.post(`/roles/${data.id}/permissions`, {
        permissionIds: data.permissions,
      });
    },
    onSuccess: () => {
      toast.success("Rol actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al actualizar rol");
    },
  });

  const handleSubmit = () => {
    if (!name) return toast.error("El nombre es requerido");

    const payload = {
      name,
      permissions: selectedPermissions,
    };

    if (role) {
      updateRoleMutation.mutate({ ...payload, id: role.id });
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  const togglePermission = (permCode: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permCode)
        ? prev.filter((code) => code !== permCode)
        : [...prev, permCode],
    );
  };

  const isPending =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  // Group permissions by module using STATIC list
  const permissionsByModule =
    ALL_PERMISSIONS.reduce((acc: any, perm: any) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {}) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          <DialogDescription>
            Configura el nombre y los permisos asignados a este rol. (Permisos
            definidos en código)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-1 overflow-auto">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Rol</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. GERENTE_VENTAS"
              disabled={!!role}
            />
          </div>

          <Separator />

          <div>
            <Label className="mb-2 block">Permisos Disponibles</Label>
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(
                  ([module, perms]: [string, any]) => (
                    <div key={module}>
                      <h4 className="font-bold uppercase text-xs text-gray-500 mb-2">
                        {module}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map((perm: any) => (
                          <div
                            key={perm.code}
                            className="flex items-start space-x-2 border p-2 rounded hover:bg-gray-50 bg-white"
                          >
                            <Checkbox
                              id={perm.code}
                              checked={selectedPermissions.includes(perm.code)}
                              onCheckedChange={() =>
                                togglePermission(perm.code)
                              }
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={perm.code}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {perm.code}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {perm.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {role ? "Guardar Cambios" : "Crear Rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
