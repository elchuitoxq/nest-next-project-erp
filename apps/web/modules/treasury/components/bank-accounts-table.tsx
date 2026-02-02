"use client";

import { useState } from "react";
import { useToggleBankAccount } from "@/modules/treasury/hooks/use-bank-accounts";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Edit2, Search, BookOpen, Loader2 } from "lucide-react";
import { BankAccountLedger } from "./bank-account-ledger";
import { motion, AnimatePresence } from "framer-motion";

interface BankAccountsTableProps {
  accounts: any[];
  onEdit: (acc: any) => void;
  isLoading?: boolean;
}

export function BankAccountsTable({
  accounts,
  onEdit,
  isLoading,
}: BankAccountsTableProps) {
  const { mutate: toggleActive } = useToggleBankAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const filteredAccounts =
    accounts?.filter((acc) => {
      const term = searchTerm.toLowerCase();
      return (
        acc.name.toLowerCase().includes(term) ||
        acc.accountNumber?.toLowerCase().includes(term) ||
        acc.currency?.code.toLowerCase().includes(term)
      );
    }) || [];

  return (
    <div className="space-y-4">
      {/* Ledger Dialog */}
      {selectedAccount && (
        <BankAccountLedger
          isOpen={!!selectedAccount}
          onClose={() => setSelectedAccount(null)}
          account={selectedAccount}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, cuenta o moneda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md relative">
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
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Número de Cuenta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">Saldo Actual</TableHead>
              <TableHead className="text-right">Activo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {filteredAccounts.map((acc, index) => (
                <motion.tr
                  key={acc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group"
                >
                  <TableCell className="font-medium py-3 px-4">
                    {acc.name}
                  </TableCell>
                  <TableCell className="font-mono-data text-xs py-3 px-4">
                    {acc.accountNumber || "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4">{acc.type}</TableCell>
                  <TableCell className="py-3 px-4">
                    {acc.currency?.code}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono-data text-sm py-3 px-4">
                    {formatCurrency(acc.currentBalance, acc.currency?.symbol)}
                  </TableCell>
                  <TableCell className="text-right py-3 px-4">
                    <div className="flex justify-end gap-2 items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAccount(acc)}
                        title="Ver Libro de Banco"
                      >
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(acc)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={acc.isActive}
                        onCheckedChange={() => toggleActive(acc.id)}
                      />
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {!isLoading && filteredAccounts.length === 0 && (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {accounts?.length === 0
                      ? "No hay cuentas bancarias registradas."
                      : "No se encontraron cuentas con ese criterio."}
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
