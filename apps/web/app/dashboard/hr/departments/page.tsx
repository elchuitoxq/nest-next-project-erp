"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit, Loader2, Building2 } from "lucide-react";
import {
  useDepartments,
  useDepartmentMutations,
  Department,
} from "@/modules/hr/hooks/use-departments";
import { useState } from "react";
import { DepartmentDialog } from "@/modules/hr/components/dialogs/department-dialog";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/use-auth-store";

export default function DepartmentsPage() {
  const { currentBranch } = useAuthStore();
  const { data: departments, isLoading } = useDepartments(currentBranch?.id);
  const { deleteDepartment } = useDepartmentMutations();
  const [open, setOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setOpen(true);
  };

  const filteredDepartments =
    departments?.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "-";
    return departments?.find((d) => d.id === parentId)?.name || "Desconocido";
  };

  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
            <p className="text-muted-foreground">
              Gestión de la estructura organizacional y jerarquía.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 premium-shadow">
            <Plus className="h-4 w-4" /> Nuevo Departamento
          </Button>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Departamentos</CardTitle>
                <CardDescription>
                  {currentBranch?.name || "Todas las sucursales"}
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar departamento..."
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
                    <TableHead className="w-[300px] px-4">Nombre</TableHead>
                    <TableHead className="px-4">Departamento Padre</TableHead>
                    <TableHead className="px-4 text-center">
                      Empleados
                    </TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (filteredDepartments.length ?? 0) > 0 ? (
                      filteredDepartments.map((dept, index) => (
                        <motion.tr
                          key={dept.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                        >
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-primary/10 text-primary border border-primary/20">
                                <AvatarFallback className="bg-transparent font-bold">
                                  {dept.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold">{dept.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-muted-foreground">
                            {getParentName(dept.parentId)}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center font-mono font-medium">
                            {dept.employeeCount || 0}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => handleEdit(dept)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-red-50 transition-colors"
                                onClick={() => deleteDepartment.mutate(dept.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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
                          className="text-center h-48 text-muted-foreground italic"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="h-8 w-8 opacity-20" />
                            <p>No se encontraron departamentos.</p>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <DepartmentDialog
        open={open}
        onOpenChange={setOpen}
        departmentToEdit={editingDepartment}
      />
    </SidebarInset>
  );
}
