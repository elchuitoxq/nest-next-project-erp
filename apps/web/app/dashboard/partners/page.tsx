"use client";

import { useRouter } from "next/navigation";

import {
  usePartners,
  usePartnerMutations,
} from "@/modules/partners/hooks/use-partners";
import { PartnersTable } from "@/modules/partners/components/partners-table";
import { PartnerDialog } from "@/modules/partners/components/partner-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Partner } from "@/modules/partners/types";
import { Input } from "@/components/ui/input";
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

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const { data: partners, isLoading, isError } = usePartners(search);
  const { deletePartner } = usePartnerMutations();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const handleCreate = () => {
    setEditingPartner(null);
    setDialogOpen(true);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setDialogOpen(true);
  };

  const handleDelete = async (partner: Partner) => {
    if (confirm("¿Estás seguro de eliminar este socio?")) {
      await deletePartner.mutateAsync(partner.id);
    }
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
                <BreadcrumbPage>Clientes y Socios</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Clientes y Socios
            </h2>
            <p className="text-muted-foreground">
              Gestiona clientes y proveedores de tu negocio.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Socio
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes y Socios</CardTitle>
            <CardDescription>
              Visualiza y administra tus socios comerciales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center py-4">
              <Input
                placeholder="Buscar por nombre o RIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-red-500 py-8 text-center">
                Error al cargar socios. Por favor intente nuevamente.
              </div>
            ) : (
              <PartnersTable
                partners={partners || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewStatement={(p) =>
                  router.push(`/dashboard/treasury/statements/${p.id}`)
                }
              />
            )}
          </CardContent>
        </Card>

        <PartnerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          partnerToEdit={editingPartner}
        />
      </div>
    </SidebarInset>
  );
}
