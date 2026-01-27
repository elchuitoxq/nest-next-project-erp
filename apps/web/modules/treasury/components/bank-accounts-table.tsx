"use client";

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
import { Edit2 } from "lucide-react";

interface BankAccountsTableProps {
  accounts: any[];
  onEdit: (acc: any) => void;
}

export function BankAccountsTable({ accounts, onEdit }: BankAccountsTableProps) {
  const { mutate: toggleActive } = useToggleBankAccount();

  return (
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
        {accounts?.map((acc) => (
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
        {(!accounts || accounts.length === 0) && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center py-8 text-muted-foreground"
            >
              No hay cuentas bancarias registradas.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
