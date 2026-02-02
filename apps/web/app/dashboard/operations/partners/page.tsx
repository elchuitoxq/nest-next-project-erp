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

import { PaginationState } from "@tanstack/react-table";

import { motion } from "framer-motion";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

export default function PartnersPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const {
    data: partnersResponse,
    isLoading,
    isError,
  } = usePartners({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
    type: typeFilter.length > 0 ? typeFilter : undefined,
  });

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
        <div className="flex items-center justify-between space-y-2 py-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Clientes y Socios
            </h2>
            <p className="text-muted-foreground text-sm">
              Gestiona clientes y proveedores de tu negocio
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleCreate}
              className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Socio
            </Button>
          </div>
        </div>

        <Card className="border shadow-xl bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Listado de Clientes y Socios
            </CardTitle>
            <CardDescription>
              Visualiza y administra tus socios comerciales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500 py-12 text-center border-dashed border-2 rounded-xl border-red-200 bg-red-50/50">
                <p className="font-semibold text-lg">Error al cargar socios</p>
                <p className="text-sm">Por favor intente nuevamente.</p>
              </div>
            ) : (
              <PartnersTable
                data={partnersResponse?.data || []}
                pageCount={partnersResponse?.meta.lastPage || 1}
                pagination={pagination}
                onPaginationChange={setPagination}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewStatement={(p) =>
                  router.push(`/dashboard/treasury/statements/${p.id}`)
                }
                search={search}
                onSearchChange={setSearch}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
              />
            )}
          </CardContent>
        </Card>

        <PartnerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          partnerToEdit={editingPartner}
        />
      </motion.div>
    </SidebarInset>
  );
}
