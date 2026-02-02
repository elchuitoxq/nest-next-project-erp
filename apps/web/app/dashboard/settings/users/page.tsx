"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "@/modules/users/components/users-table";
import { UserDialog } from "@/modules/users/components/user-dialog";
import { useUsers } from "@/modules/users/hooks/use-users";
import { User } from "@/modules/users/types";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

import { motion } from "framer-motion";

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [search, setSearch] = useState("");

  const handleCreate = () => {
    setSelectedUser(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Client-side filtering to search across all fields (except actions)
  const filteredUsers =
    users?.filter((user) => {
      const term = search.toLowerCase();
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.roles.some((role) => role.toLowerCase().includes(term))
      );
    }) || [];

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
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Usuarios y Roles
            </h2>
            <p className="text-muted-foreground">
              Gestiona los usuarios del sistema y sus niveles de acceso.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreate} className="premium-shadow">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          </div>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Usuarios</CardTitle>
                <CardDescription>
                  Visualiza y administra los usuarios registrados.
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre, email o rol..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Cargando usuarios...
                </p>
              </div>
            ) : isError ? (
              <div className="text-red-500 py-12 text-center border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                <p className="font-semibold text-lg">
                  Error al cargar usuarios
                </p>
                <p className="text-sm">Por favor intente nuevamente.</p>
              </div>
            ) : (
              <UsersTable
                users={filteredUsers}
                onEdit={handleEdit}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>

        <UserDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
        />
      </motion.div>
    </SidebarInset>
  );
}
