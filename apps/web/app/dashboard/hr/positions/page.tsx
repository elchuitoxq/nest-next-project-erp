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
import { usePositions, JobPosition } from "@/modules/hr/hooks/use-positions";
import { PositionDialog } from "@/modules/hr/components/position-dialog";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { GuideCard } from "@/components/guide/guide-card";

export default function PositionsPage() {
  const { data: positions, isLoading } = usePositions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<
    JobPosition | undefined
  >();
  const [search, setSearch] = useState("");

  const handleEdit = (pos: JobPosition) => {
    setSelectedPosition(pos);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPosition(undefined);
    setDialogOpen(true);
  };

  // Client-side filtering
  const filteredPositions = positions?.filter((pos) => {
    const term = search.toLowerCase();
    return (
      pos.name.toLowerCase().includes(term) ||
      pos.description?.toLowerCase().includes(term)
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
        <PageHeader
          title="Cargos y Salarios"
          description="Administra los puestos de trabajo y tabuladores salariales."
        >
          <Button
            onClick={handleCreate}
            className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cargo
          </Button>
        </PageHeader>

        <GuideCard
          title="Gestión de Cargos y Salarios"
          variant="info"
          className="mb-4"
        >
          <p>
            Defina la estructura organizativa y las bandas salariales de la
            empresa.
          </p>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>
              <strong>Rango Salarial:</strong> Límites de remuneración (Min/Max)
              para control presupuestario.
            </li>
            <li>
              <strong>Moneda Base:</strong> Referencia para cálculos de nómina y
              beneficios legales.
            </li>
          </ul>
        </GuideCard>

        <Card className="border shadow-xl bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Cargos</CardTitle>
                <CardDescription>
                  Estructura organizativa y salarial
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre o descripción..."
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
                    <TableHead className="px-4">Descripción</TableHead>
                    <TableHead className="px-4">Rango Salarial (Ref)</TableHead>
                    <TableHead className="px-4">Moneda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (filteredPositions?.length ?? 0) > 0 ? (
                      filteredPositions?.map((pos, index) => (
                        <motion.tr
                          key={pos.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="cursor-pointer hover:bg-muted/50 border-b last:border-0 transition-colors group"
                          onClick={() => handleEdit(pos)}
                        >
                          <TableCell className="py-3 px-4 font-bold text-sm text-foreground">
                            {pos.name}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs text-muted-foreground italic">
                            {pos.description || "Sin descripción"}
                          </TableCell>
                          <TableCell className="py-3 px-4 font-mono-data text-xs font-bold text-primary">
                            {pos.baseSalaryMin && pos.baseSalaryMax
                              ? `${formatCurrency(pos.baseSalaryMin, pos.currency?.code)} - ${formatCurrency(pos.baseSalaryMax, pos.currency?.code)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-inset ring-muted-foreground/20">
                              {pos.currency?.code || "N/A"}
                            </span>
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
                          className="h-32 text-center text-muted-foreground italic"
                        >
                          No se encontraron cargos.
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <PositionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          position={selectedPosition}
        />
      </motion.div>
    </SidebarInset>
  );
}
