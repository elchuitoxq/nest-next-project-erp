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
import { Loader2, Plus, Edit2, Check, X } from "lucide-react";
import {
  useBanks,
  useBankMutations,
  Bank,
} from "@/modules/settings/banks/hooks/use-banks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { BankDialog } from "@/modules/settings/banks/components/bank-dialog";
import { Switch } from "@/components/ui/switch";

import { motion, AnimatePresence } from "framer-motion";

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
              Maestro de Bancos
            </h1>
            <p className="text-muted-foreground">
              Gestión de entidades bancarias y códigos SUDEBAN.
            </p>
          </div>
          <Button className="gap-2 premium-shadow" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nuevo Banco
          </Button>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <CardTitle>Listado de Bancos</CardTitle>
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
                    <TableHead className="text-center px-4">Activo</TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading || (banks?.length ?? 0) > 0 ? (
                      banks?.map((bank: Bank, index: number) => (
                        <motion.tr
                          key={bank.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                        >
                          <TableCell className="font-mono-data py-3 px-4 text-xs font-bold text-primary">
                            {bank.code}
                          </TableCell>
                          <TableCell className="font-bold py-3 px-4 text-sm">
                            {bank.name}
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <Switch
                              checked={bank.isActive}
                              onCheckedChange={() => toggleBank.mutate(bank.id)}
                              className="scale-90"
                            />
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => handleEdit(bank)}
                            >
                              <Edit2 className="h-4 w-4" />
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
                          colSpan={4}
                          className="text-center h-48 text-muted-foreground italic"
                        >
                          No hay bancos registrados.
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

      <BankDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bank={selectedBank}
      />
    </SidebarInset>
  );
}
