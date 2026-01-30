"use client";

import { useState } from "react";
import {
  useToggleBankAccount,
} from "@/modules/treasury/hooks/use-bank-accounts";
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
import { Edit2, Search, BookOpen } from "lucide-react";
import { BankAccountLedger } from "./bank-account-ledger";

interface BankAccountsTableProps {
  accounts: any[];
  onEdit: (acc: any) => void;
}

export function BankAccountsTable({ accounts, onEdit }: BankAccountsTableProps) {
  const { mutate: toggleActive } = useToggleBankAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const filteredAccounts = accounts?.filter((acc) => {
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

      <div className="border rounded-md">
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
            {filteredAccounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {acc.accountNumber || "-"}
                </TableCell>
                <TableCell>{acc.type}</TableCell>
                <TableCell>{acc.currency?.code}</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(acc.currentBalance, acc.currency?.symbol)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedAccount(acc)}
                      title="Ver Libro de Banco"
                    >
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(acc)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={acc.isActive}
                      onCheckedChange={() => toggleActive(acc.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredAccounts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {accounts?.length === 0
                    ? "No hay cuentas bancarias registradas."
                    : "No se encontraron cuentas con ese criterio."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
