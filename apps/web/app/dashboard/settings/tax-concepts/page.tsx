"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { useTaxConcepts } from "@/modules/settings/tax-concepts/hooks/use-tax-concepts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { motion, AnimatePresence } from "framer-motion";

export default function TaxConceptsPage() {
  const { data: concepts, isLoading } = useTaxConcepts();

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
            <h1 className="text-3xl font-bold tracking-tight">
              Conceptos de Retención ISLR
            </h1>
            <p className="text-muted-foreground">
              Catálogo oficial de conceptos y porcentajes de retención de ISLR.
            </p>
          </div>
          <Button className="gap-2 premium-shadow">
            <Plus className="h-4 w-4" /> Nuevo Concepto
          </Button>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <CardTitle>Listado de Conceptos</CardTitle>
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
                    <TableHead className="px-4">Descripción</TableHead>
                    <TableHead className="text-right px-4">
                      % Retención
                    </TableHead>
                    <TableHead className="text-right px-4">
                      Base Mínima
                    </TableHead>
                    <TableHead className="text-right px-4">
                      Sustraendo
                    </TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (concepts?.length ?? 0) > 0 ? (
                      concepts?.map((concept: any, index: number) => (
                        <motion.tr
                          key={concept.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                        >
                          <TableCell className="font-mono-data text-xs font-bold text-primary py-3 px-4">
                            {concept.code}
                          </TableCell>
                          <TableCell className="font-bold text-sm py-3 px-4 italic">
                            {concept.name}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="font-mono-data text-xs font-bold bg-orange-500/10 text-orange-600 border-orange-200"
                            >
                              {concept.retentionPercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3 px-4 font-mono-data text-xs">
                            {concept.baseMin}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4 font-mono-data text-xs">
                            {concept.sustraendo}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4 space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
                          colSpan={6}
                          className="text-center h-48 text-muted-foreground italic"
                        >
                          No hay conceptos registrados.
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
    </SidebarInset>
  );
}
