"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { usePayrollConcepts, usePayrollConceptMutations } from "@/modules/hr/concepts/hooks/use-payroll-concepts";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ConceptDialog } from "@/modules/hr/concepts/components/concept-dialog";
import { Input } from "@/components/ui/input";

export default function PayrollConceptsPage() {
  const { data: concepts, isLoading } = usePayrollConcepts();
  const { deleteConcept } = usePayrollConceptMutations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredConcepts = concepts?.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Configuración</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Conceptos de Nómina</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Conceptos de Nómina</h1>
            <p className="text-muted-foreground">Definición de asignaciones y deducciones.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Concepto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Conceptos</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>
                Catálogo de conceptos salariales activos.
              </CardDescription>
              <div className="w-[300px]">
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">Cargando...</TableCell>
                    </TableRow>
                  ) : filteredConcepts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        No se encontraron conceptos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConcepts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>
                          <Badge variant={c.category === "INCOME" ? "default" : "destructive"}>
                            {c.category === "INCOME" ? "Asignación" : "Deducción"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!c.isSystem && (
                            <Button variant="ghost" size="icon" onClick={() => deleteConcept.mutate(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <ConceptDialog open={open} onOpenChange={setOpen} />
    </SidebarInset>
  );
}
