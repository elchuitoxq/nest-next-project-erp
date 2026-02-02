"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmployees, Employee } from "@/modules/hr/hooks/use-employees";
import { EmployeeDialog } from "@/modules/hr/components/employee-dialog";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<
    Employee | undefined
  >();
  const [search, setSearch] = useState("");

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedEmployee(undefined);
    setDialogOpen(true);
  };

  // Client-side filtering
  const filteredEmployees = employees?.filter((emp) => {
    const term = search.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.identityCard.toLowerCase().includes(term) ||
      emp.position?.name.toLowerCase().includes(term)
    );
  });

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
        <div className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Empleados
            </h2>
            <p className="text-muted-foreground">
              Gestión de personal y nómina.
            </p>
          </div>
          <Button onClick={handleCreate} className="premium-shadow">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Empleado
          </Button>
        </div>

        <Card className="border shadow-xl bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Personal</CardTitle>
                <CardDescription>
                  Gestión de nómina y datos laborales
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre, cédula o cargo..."
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
                    <TableHead className="px-4">Nombre</TableHead>
                    <TableHead className="px-4">Cargo</TableHead>
                    <TableHead className="px-4">Salario Base</TableHead>
                    <TableHead className="px-4">Frecuencia</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (filteredEmployees?.length ?? 0) > 0 ? (
                      filteredEmployees?.map((emp, index) => (
                        <motion.tr
                          key={emp.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { delay: index * 0.03 },
                          }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="cursor-pointer hover:bg-muted/50 border-b last:border-0 transition-colors group"
                          onClick={() => handleEdit(emp)}
                        >
                          <TableCell className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-[10px] font-mono-data text-muted-foreground tabular-nums">
                                {emp.identityCard}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs font-medium">
                            {emp.position?.name || "-"}
                          </TableCell>
                          <TableCell className="py-3 px-4 font-mono-data text-xs font-bold text-foreground">
                            {formatCurrency(
                              emp.baseSalary,
                              emp.salaryCurrency?.code || "Bs",
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase font-bold tracking-tighter"
                            >
                              {emp.payFrequency}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge
                              className={cn(
                                "text-[10px] uppercase font-bold",
                                emp.status === "ACTIVE"
                                  ? "bg-green-500/10 text-green-600 border-green-200"
                                  : "bg-gray-500/10 text-gray-500 border-gray-200",
                              )}
                              variant="outline"
                            >
                              {emp.status}
                            </Badge>
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
                          colSpan={5}
                          className="h-32 text-center text-muted-foreground italic"
                        >
                          No se encontraron empleados.
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <EmployeeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employee={selectedEmployee}
        />
      </motion.div>
    </SidebarInset>
  );
}
