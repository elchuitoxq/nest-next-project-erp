"use client";

import {
  useToggleBankAccount,
  useCreateBankAccount,
  useUpdateBankAccount,
} from "@/modules/treasury/hooks/use-bank-accounts";
import { BankAccountsTable } from "@/modules/treasury/components/bank-accounts-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

export default function BankAccountsPage() {
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

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
                <BreadcrumbLink href="#">Finanzas</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Cuentas y Monedas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Cuentas Bancarias
            </h1>
            <p className="text-muted-foreground">
              Administra tus cuentas bancarias.
            </p>
          </div>
          <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
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
                  <Label>Nombre</Label>
                  <Input
                    placeholder="Ej. Banesco Principal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Número de Cuenta</Label>
                  <Input
                    placeholder="0134..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHECKING">Corriente</SelectItem>
                        <SelectItem value="SAVINGS">Ahorro</SelectItem>
                        <SelectItem value="WALLET">
                          Billetera Digital (Zelle/PayPal)
                        </SelectItem>
                        <SelectItem value="CASH">
                          Caja Física (Efectivo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Moneda</Label>
                    <Select value={currencyId} onValueChange={setCurrencyId}>
                      <SelectTrigger>
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
                  <Label>Saldo Inicial / Actual</Label>
                  <Input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                  {editingAccount ? "Actualizar" : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <div className="space-y-6">
            <BankAccountsTable onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
