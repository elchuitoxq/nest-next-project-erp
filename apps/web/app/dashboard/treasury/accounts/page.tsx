"use client";

import {
  useToggleBankAccount,
  useCreateBankAccount,
  useUpdateBankAccount,
  useBankAccounts,
} from "@/modules/treasury/hooks/use-bank-accounts";
import { BankAccountsTable } from "@/modules/treasury/components/bank-accounts-table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
export default function BankAccountsPage() {
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const { data: accounts, isLoading } = useBankAccounts();
  const { mutate: createAccount, isPending: isCreating } =
    useCreateBankAccount();
  const { mutate: updateAccount, isPending: isUpdating } =
    useUpdateBankAccount();

  const isPending = isCreating || isUpdating;

  // Form State
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [type, setType] = useState("CHECKING");
  const [currencyId, setCurrencyId] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");

  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get("/settings/currencies");
      return data;
    },
  });

  const handleEdit = (acc: any) => {
    setEditingAccount(acc);
    setName(acc.name);
    setAccountNumber(acc.accountNumber || "");
    setType(acc.type);
    setCurrencyId(acc.currencyId);
    setInitialBalance(acc.currentBalance);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAccount(null);
    setName("");
    setAccountNumber("");
    setType("CHECKING");
    setCurrencyId("");
    setInitialBalance("0");
  };

  const handleSubmit = () => {
    if (!name || !currencyId) {
      toast.error("Nombre y Moneda requeridos");
      return;
    }

    const payload = {
      name,
      accountNumber,
      type,
      currencyId,
      currentBalance: initialBalance,
    };

    if (editingAccount) {
      updateAccount(
        { id: editingAccount.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Cuenta actualizada");
            handleClose();
          },
        },
      );
    } else {
      createAccount(payload, {
        onSuccess: () => {
          toast.success("Cuenta creada");
          handleClose();
        },
      });
    }
  };

  return (
    <SidebarInset>
      <AppHeader />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Cuentas Bancarias"
          description="Administra tus cuentas bancarias y saldos de tesorería"
        >
          <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setOpen(true)}
                className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white/95 backdrop-blur-lg border-gray-100 shadow-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {editingAccount
                    ? "Editar Cuenta"
                    : "Registrar Cuenta Bancaria"}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount
                    ? "Modifica los datos de la cuenta."
                    : "Agrega una nueva cuenta para conciliar pagos."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Nombre de la Cuenta
                  </Label>
                  <Input
                    placeholder="Ej. Banesco Principal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-50/50 border-gray-200 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Número de Cuenta
                  </Label>
                  <Input
                    placeholder="0134..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-gray-50/50 border-gray-200 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Tipo
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="bg-gray-50/50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHECKING">Corriente</SelectItem>
                        <SelectItem value="SAVINGS">Ahorro</SelectItem>
                        <SelectItem value="WALLET">
                          Billetera Digital
                        </SelectItem>
                        <SelectItem value="CASH">
                          Caja Física (Efectivo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Moneda
                    </Label>
                    <Select value={currencyId} onValueChange={setCurrencyId}>
                      <SelectTrigger className="bg-gray-50/50 border-gray-200">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Saldo Inicial
                  </Label>
                  <Input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="bg-gray-50/50 border-gray-200 focus:border-blue-500 transition-all font-bold text-blue-600"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="premium-shadow bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider"
                >
                  {isPending && (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  )}
                  {editingAccount ? "Actualizar" : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <Card className="border premium-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Listado de Cuentas
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las cuentas de tesorería registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountsTable
              accounts={accounts || []}
              onEdit={handleEdit}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </motion.div>
    </SidebarInset>
  );
}
