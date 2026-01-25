"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaxConceptsPage() {
  const { data: concepts, isLoading } = useTaxConcepts();

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Configuración</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Conceptos ISLR</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Conceptos de Retención ISLR
            </h1>
            <p className="text-muted-foreground">
              Catálogo oficial de conceptos y porcentajes de retención de ISLR.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Concepto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Conceptos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">% Retención</TableHead>
                    <TableHead className="text-right">Base Mínima</TableHead>
                    <TableHead className="text-right">Sustraendo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : concepts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay conceptos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    concepts?.map((concept: any) => (
                      <TableRow key={concept.id}>
                        <TableCell className="font-mono text-sm">
                          {concept.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {concept.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {concept.retentionPercentage}%
                        </TableCell>
                        <TableCell className="text-right">
                          {concept.baseMin}
                        </TableCell>
                        <TableCell className="text-right">
                          {concept.sustraendo}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </SidebarInset>
  );
}
