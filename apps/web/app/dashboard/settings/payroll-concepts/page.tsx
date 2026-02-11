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
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  usePayrollConcepts,
  usePayrollConceptMutations,
} from "@/modules/hr/concepts/hooks/use-payroll-concepts";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ConceptDialog } from "@/modules/hr/concepts/components/concept-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { motion, AnimatePresence } from "framer-motion";

export default function PayrollConceptsPage() {
  const { data: concepts, isLoading } = usePayrollConcepts();
  const { deleteConcept } = usePayrollConceptMutations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredConcepts =
    concepts?.filter((c) => {
      const term = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
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
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Conceptos de Nómina
            </h1>
            <p className="text-muted-foreground">
              Definición de asignaciones y deducciones.
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="gap-2 premium-shadow"
          >
            <Plus className="h-4 w-4" /> Nuevo Concepto
          </Button>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Conceptos</CardTitle>
                <CardDescription>
                  Catálogo de conceptos salariales activos.
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre o código..."
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
                    <TableHead className="px-4">Código</TableHead>
                    <TableHead className="px-4">Nombre</TableHead>
                    <TableHead className="px-4">Categoría</TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (filteredConcepts.length ?? 0) > 0 ? (
                      filteredConcepts.map((c, index) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                        >
                          <TableCell className="font-mono-data text-xs font-bold text-primary py-3 px-4">
                            {c.code}
                          </TableCell>
                          <TableCell className="font-bold text-sm py-3 px-4">
                            {c.name}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-bold tracking-tighter",
                                c.category === "INCOME"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-200"
                                  : "bg-red-500/10 text-red-600 border-red-200",
                              )}
                            >
                              {c.category === "INCOME"
                                ? "Asignación"
                                : "Deducción"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            {!c.isSystem && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-red-50 transition-colors"
                                onClick={() => deleteConcept.mutate(c.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
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
                          No se encontraron conceptos.
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
      <ConceptDialog open={open} onOpenChange={setOpen} />
    </SidebarInset>
  );
}
