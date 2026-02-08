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
import { PageHeader } from "@/components/layout/page-header";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

import { BranchesTable } from "@/modules/branches/components/branches-table";
import { BranchDialog } from "@/modules/branches/components/branch-dialog";
import { useBranches } from "@/modules/branches/hooks/use-branches";
import { Branch } from "@/modules/branches/types";

export default function BranchesPage() {
  const { data: branches, isLoading, isError } = useBranches();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>(
    undefined,
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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title="Sedes (Sucursales)"
          description="Gestiona las sedes físicas de tu organización."
        >
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nueva Sede
            </Button>
          </div>
        </PageHeader>

        <Card className="premium-shadow">
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
              <BranchesTable
                branches={branches || []}
                onEdit={handleEdit}
                isLoading={isLoading}
              />
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
