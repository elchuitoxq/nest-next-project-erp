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

import { BranchesTable } from "@/modules/branches/components/branches-table";
import { BranchDialog } from "@/modules/branches/components/branch-dialog";
import { useBranches } from "@/modules/branches/hooks/use-branches";
import { Branch } from "@/modules/branches/types";

export default function BranchesPage() {
  const { data: branches, isLoading, isError } = useBranches();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>(
    undefined
  );

  const handleCreate = () => {
    setSelectedBranch(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };

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
                <BreadcrumbLink href="#">Operaciones</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Sucursales</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Sedes (Sucursales)
            </h2>
            <p className="text-muted-foreground">
              Gestiona las sedes físicas de tu organización.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Sede
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Sedes</CardTitle>
            <CardDescription>
              Visualiza y administra tus sucursales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar sedes. Por favor intente nuevamente.
              </div>
            ) : (
              <BranchesTable branches={branches || []} onEdit={handleEdit} />
            )}
          </CardContent>
        </Card>

        <BranchDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          branch={selectedBranch}
        />
      </div>
    </SidebarInset>
  );
}
