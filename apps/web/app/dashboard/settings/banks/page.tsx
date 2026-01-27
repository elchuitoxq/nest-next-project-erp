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
import { Loader2, Plus, Edit2, Check, X } from "lucide-react";
import { useBanks, useBankMutations, Bank } from "@/modules/settings/banks/hooks/use-banks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { BankDialog } from "@/modules/settings/banks/components/bank-dialog";
import { Switch } from "@/components/ui/switch";

export default function BanksPage() {
  const { data: banks, isLoading } = useBanks();
  const { toggleBank } = useBankMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | undefined>();

  const handleEdit = (bank: Bank) => {
    setSelectedBank(bank);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedBank(undefined);
    setDialogOpen(true);
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
                <BreadcrumbLink href="#">Configuración</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Maestro de Bancos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Maestro de Bancos
            </h1>
            <p className="text-muted-foreground">
              Gestión de entidades bancarias y códigos SUDEBAN.
            </p>
          </div>
          <Button className="gap-2" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nuevo Banco
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Bancos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : banks?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No hay bancos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    banks?.map((bank: Bank) => (
                      <TableRow key={bank.id}>
                        <TableCell className="font-mono">{bank.code}</TableCell>
                        <TableCell className="font-medium">
                          {bank.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={bank.isActive}
                            onCheckedChange={() => toggleBank.mutate(bank.id)}
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(bank)}
                          >
                            <Edit2 className="h-4 w-4" />
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

      <BankDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bank={selectedBank}
      />
    </SidebarInset>
  );
}
