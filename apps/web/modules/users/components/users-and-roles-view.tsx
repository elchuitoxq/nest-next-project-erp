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
import { PageHeader } from "@/components/layout/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolesView } from "@/modules/roles/components/roles-view";
import { motion } from "framer-motion";
import { RoleDialog } from "@/modules/roles/components/role-dialog";

export function UsersAndRolesView() {
  const [activeTab, setActiveTab] = useState("users");

  const { data: users, isLoading, isError } = useUsers();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [search, setSearch] = useState("");

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

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
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Usuarios y Roles"
          description="Gestiona los usuarios del sistema y sus niveles de acceso."
        >
          {activeTab === "users" ? (
            <Button
              onClick={handleCreateUser}
              className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          ) : (
            <Button
              onClick={handleCreateRole}
              className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
            </Button>
          )}
        </PageHeader>

        <Tabs
          defaultValue="users"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="roles">Roles y Permisos</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="border premium-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  Listado de Usuarios
                </CardTitle>
                <CardDescription>
                  Administra el acceso del personal al ERP.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Cargando...
                    </p>
                  </div>
                ) : isError ? (
                  <div className="p-8 text-center text-red-500 border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                    Error al cargar usuarios
                  </div>
                ) : (
                  <UsersTable
                    users={filteredUsers}
                    onEdit={handleEditUser}
                    isLoading={isLoading}
                    search={search}
                    onSearchChange={setSearch}
                  />
                )}
              </CardContent>
            </Card>

            <UserDialog
              open={isUserDialogOpen}
              onOpenChange={setIsUserDialogOpen}
              user={selectedUser}
            />
          </TabsContent>

          <TabsContent value="roles">
            <RolesView onEdit={handleEditRole} />
            <RoleDialog
              open={isRoleDialogOpen}
              onOpenChange={setIsRoleDialogOpen}
              role={editingRole}
              onClose={() => setIsRoleDialogOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </SidebarInset>
  );
}
