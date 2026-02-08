import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, ShieldCheck, Mail, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { GuideCard } from "@/components/guide/guide-card";

import { useRoles } from "../hooks/use-users";
import { useBranches } from "../../branches/hooks/use-branches";
import { useUserMutations } from "../hooks/use-user-mutations";
import { User } from "../types";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserFormValues,
} from "../schemas/user.schema";

interface UserDialogProps {
  user?: User; // If present, it's edit mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const isEdit = !!user;
  const { data: roles, isLoading: loadingRoles } = useRoles();
  const { data: branches, isLoading: loadingBranches } = useBranches();
  const { createUser, updateUser } = useUserMutations();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleIds: [],
      branchIds: [],
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "", // Don't fill password on edit
        roleIds: user.roles, // Currently User type has roles as string[], but API create expects roleIds.
        // WAIT: backend implementation returns roles as string[] names, but creation needs IDs.
        // Backend `findAll` only returns role NAMES. This is a problem for editing.
        // In step 474, findOne returns roleIds array if accessed directly, but findAll only mapped roleName.
        // We need to fetch the single user detail OR update the findAll to include IDs if we want them here,
        // OR finding the role IDs based on names if unique.
        // Let's assume for now we might need to rely on what we have, or fetch.
        // Actually, in `UsersService.findAll`, I grouped roles manually pushing `row.roleName`.
      });
      // ISSUE: User object from `findAll` only has role names. The form needs Role IDs.
      // Quick fix: Map role names to IDs from the `roles` query if names are unique.
    } else if (!user && open) {
      form.reset({
        name: "",
        email: "",
        password: "",
        roleIds: [],
        branchIds: [],
      });
    }
  }, [user, open, form]);

  // Sync role names to IDs for edition if needed.
  useEffect(() => {
    if (user && roles && open) {
      const userRoleIds = roles
        .filter((r) => user.roles.includes(r.name)) // user.roles are names
        .map((r) => r.id);
      form.setValue("roleIds", userRoleIds);
    }
    if (user && branches && open) {
      if (user.branches) {
        const userBranchIds = user.branches.map((b) => b.id);
        form.setValue("branchIds", userBranchIds);
      }
    }
  }, [user, roles, branches, open, form]);

  const onSubmit = async (data: CreateUserFormValues) => {
    try {
      if (isEdit && user) {
        await updateUser.mutateAsync({
          id: user.id,
          name: data.name,
          email: data.email,
          password: data.password || undefined,
          roleIds: data.roleIds,
          branchIds: data.branchIds,
        });
      } else {
        await createUser.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password!,
          roleIds: data.roleIds,
          branchIds: data.branchIds,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los permisos y accesos del colaborador."
              : "Configura una nueva cuenta de acceso al sistema."}
          </DialogDescription>
        </DialogHeader>

        <GuideCard title="Modelo de Permisos" variant="info" className="mb-4">
          <p>El acceso se define por dos dimensiones:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Roles (Qué puede hacer):</strong> Define permisos
              funcionales (ej. Crear Facturas, Ver Reportes).
            </li>
            <li>
              <strong>Sucursales (Dónde lo puede hacer):</strong> Limita la data
              visible solo a las sedes seleccionadas.
            </li>
          </ul>
        </GuideCard>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-4 p-4 bg-muted/30 rounded-xl border border-dashed mb-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <UserCircle className="size-3" /> Nombre Completo
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Pérez"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Mail className="size-3" /> Correo Electrónico
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="juan@ejemplo.com"
                        className="bg-background"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit ? "Contraseña (Opcional)" : "Contraseña"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <FormLabel>Roles</FormLabel>
              {loadingRoles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {roles?.map((role) => (
                    <FormField
                      key={role.id}
                      control={form.control}
                      name="roleIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, role.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role.id,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {role.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <FormLabel>Sucursales (Acceso)</FormLabel>
              {loadingBranches ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border p-2 rounded">
                  {branches?.map((branch) => (
                    <FormField
                      key={branch.id}
                      control={form.control}
                      name="branchIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={branch.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(branch.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        branch.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== branch.id,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm cursor-pointer">
                              {branch.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto px-8"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
                className="w-full sm:w-auto px-8"
              >
                {(createUser.isPending || updateUser.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
