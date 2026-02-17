"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePaymentMethods,
  useRegisterPayment,
  useAccountStatement,
} from "../hooks/use-treasury";
import { useBankAccounts } from "../hooks/use-bank-accounts";
import { Invoice } from "@/modules/billing/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Wallet, Receipt, CircleDollarSign } from "lucide-react";
interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export function PaymentDialog({
  isOpen,
  onClose,
  invoice,
}: PaymentDialogProps) {
  const { data: methods } = usePaymentMethods();
  const { data: bankAccounts } = useBankAccounts();
  const { mutate: registerPayment, isPending } = useRegisterPayment();

  // Fetch currencies to identify Foreign vs Base (VES)
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get("/settings/currencies");
      // Define manually key types if needed or trust API
      return data as {
        id: string;
        code: string;
        isBase: boolean;
        symbol: string;
      }[];
    },
  });

  const [methodId, setMethodId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [igtfAmount, setIgtfAmount] = useState<number>(0);

  // Metadata fields for Retentions
  const [voucherDate, setVoucherDate] = useState("");
  const [taxBase, setTaxBase] = useState("");

  const selectedMethod = methods?.find((m) => m.id === methodId);
  const isRetention = selectedMethod?.code?.startsWith("RET_");

  // Calculate remaining balance
  const totalPaid =
    invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const remaining = Math.max(0, Number(invoice.total) - totalPaid);

  useEffect(() => {
    if (isOpen) {
      setAmount(remaining.toFixed(2));
      setReference("");
      setVoucherDate(new Date().toISOString().split("T")[0]);
      setTaxBase(invoice.totalBase.toString());
      setIgtfAmount(0);

      // Smart Logic: Auto-select Retention based on Client Profile
      // ... (existing retention logic)
      if (
        invoice.payments?.length === 0 &&
        Number(invoice.totalTax) > 0 &&
        methods
      ) {
        let targetCode = "";
        if (invoice.partner?.retentionRate) {
          const rate = Number(invoice.partner.retentionRate);
          if (rate === 75) targetCode = "RET_IVA_75";
          if (rate === 100) targetCode = "RET_IVA_100";
        }
        if (!targetCode && invoice.partner?.isSpecialTaxpayer) {
          targetCode = "RET_IVA_75";
        }
        if (targetCode) {
          const retMethod = methods.find((m) => m.code === targetCode);
          if (retMethod) {
            setMethodId(retMethod.id);
            return;
          }
        }
      }

      setMethodId("");
    }
  }, [isOpen, remaining, invoice, methods]);

  // IGTF Calculation Logic
  useEffect(() => {
    if (!selectedMethod || !currencies || !amount) {
      setIgtfAmount(0);
      return;
    }

    // Find the currency of the selected method
    const methodCurrency = currencies.find(
      (c) => c.id === selectedMethod.currencyId,
    );

    // IGTF applies if the Payment Method Currency is NOT the Base Currency (Foreign)
    // Assuming `isBase` is true for VES.
    if (methodCurrency && methodCurrency.code !== "VES") {
      // Calculate 3%
      const val = parseFloat(amount);
      if (!isNaN(val)) {
        setIgtfAmount(val * 0.03);
      } else {
        setIgtfAmount(0);
      }
    } else {
      setIgtfAmount(0);
    }
  }, [selectedMethod, currencies, amount]);

  // Auto-calculate retention amount when method changes
  useEffect(() => {
    if (!selectedMethod) return;

    // Reset Bank Account if switching to Retention or Balance
    if (
      selectedMethod.code?.startsWith("RET_") ||
      selectedMethod.code?.startsWith("BALANCE")
    ) {
      setBankAccountId("");
    }

    if (selectedMethod.code === "RET_IVA_75") {
      const retAmount = Number(invoice.totalTax) * 0.75;
      setAmount(retAmount.toFixed(2));
    } else if (selectedMethod.code === "RET_IVA_100") {
      const retAmount = Number(invoice.totalTax) * 1.0;
      setAmount(retAmount.toFixed(2));
    } else if (selectedMethod.code === "RET_ISLR") {
      setAmount("");
    } else if (!isRetention) {
      // Reset to remaining if switching back to normal payment
      setAmount(remaining.toFixed(2));
    }
  }, [selectedMethod, invoice, isRetention, remaining]);

  const { data: statement } = useAccountStatement(invoice.partnerId);

  // ... (existing balance logic)
  // Check if selected method is Balance
  const isBalancePayment = selectedMethod?.code?.startsWith("BALANCE");

  // Logic to determine Available Credit for Balance Crossing
  const currentInvoiceTotal = ["POSTED", "PARTIALLY_PAID"].includes(
    invoice.status,
  )
    ? Number(invoice.total)
    : 0;

  const rawBalance = statement?.balance || 0;
  const backendUnused = (statement as any)?.unusedBalance;
  let availableBalance = 0;

  if (typeof backendUnused === "number") {
    availableBalance = backendUnused;
  } else {
    const balanceWithoutCurrentInvoice = rawBalance - currentInvoiceTotal;
    availableBalance =
      balanceWithoutCurrentInvoice < 0
        ? Math.abs(balanceWithoutCurrentInvoice)
        : 0;
  }

  useEffect(() => {
    if (isBalancePayment) {
      setReference("Cruce de Saldo");
    }
  }, [isBalancePayment]);

  // Auto-select Cash Account
  const isCash = selectedMethod?.code?.startsWith("CASH");
  useEffect(() => {
    if (isCash && bankAccounts && !bankAccountId) {
      const cashAccount = bankAccounts.find(
        (acc) => acc.type === "CASH" && acc.currencyId === invoice.currencyId,
      );
      if (cashAccount) {
        setBankAccountId(cashAccount.id);
      }
    }
  }, [isCash, bankAccounts, invoice.currencyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!methodId || !amount) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    const isCash = selectedMethod?.code?.startsWith("CASH");

    if (!isRetention && !isBalancePayment && !isCash && !reference.trim()) {
      toast.error(
        "El número de referencia es obligatorio para este método de pago",
      );
      return;
    }

    if (isRetention) {
      if (!reference.trim()) {
        toast.error("El número de comprobante es obligatorio");
        return;
      }
      if (!voucherDate) {
        toast.error("La fecha del comprobante es obligatoria");
        return;
      }
    }

    if (!isRetention && !isBalancePayment && !bankAccountId) {
      toast.error("Debe seleccionar una cuenta de destino");
      return;
    }

    if (isBalancePayment) {
      if (Number(amount) > availableBalance) {
        toast.error(
          `Saldo sin ocupar insuficiente. Total disponible: ${formatCurrency(availableBalance)}`,
        );
        return;
      }
    }

    // Construct metadata
    const metadata: any = {};
    if (isRetention) {
      metadata.voucherDate = voucherDate;
      metadata.taxBase = taxBase;
      metadata.type = selectedMethod?.name;
    }
    if (igtfAmount > 0) {
      metadata.igtfAmount = igtfAmount.toFixed(2);
      metadata.baseAmount = amount;
      metadata.isIgtfApplied = true;
    }

    registerPayment(
      {
        invoiceId: invoice.id,
        partnerId: invoice.partnerId,
        methodId,
        currencyId: invoice.currencyId,
        amount,
        reference,
        bankAccountId:
          isRetention || isBalancePayment ? undefined : bankAccountId,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Pago registrado correctamente");
          onClose();
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          const message =
            err.response?.data?.message || "Error al registrar el pago";
          toast.error(message);
        },
      },
    );
  };

  const availableMethods = methods?.filter((m) => {
    // 1. Check strict Currency match
    if (m.currencyId && m.currencyId !== invoice.currencyId) return false;

    // 2. Handle Retentions
    if (m.code?.startsWith("RET_")) {
      const isAlreadyPaid = invoice.payments?.some((p) => {
        const pCode =
          p.method?.code ||
          methods?.find((method) => method.id === p.methodId)?.code;
        return pCode === m.code;
      });
      if (isAlreadyPaid) return false;

      if (m.code.startsWith("RET_IVA")) {
        const hasAnyIvaRetention = invoice.payments?.some((p) => {
          const pCode =
            p.method?.code ||
            methods?.find((method) => method.id === p.methodId)?.code;
          return pCode?.startsWith("RET_IVA");
        });
        if (hasAnyIvaRetention) return false;
      }
    }

    return true;
  });

  const filteredAccounts = bankAccounts?.filter((acc) => {
    // 1. Currency Match
    if (acc.currencyId !== invoice.currencyId) return false;

    // 2. Strict Allowlist (New Feature)
    if (
      selectedMethod?.allowedAccounts &&
      selectedMethod.allowedAccounts.length > 0
    ) {
      const allowedIds = selectedMethod.allowedAccounts.map(
        (x: any) => x.bankAccountId,
      );
      return allowedIds.includes(acc.id);
    }

    // 3. Fallback Type Logic
    if (isCash) {
      return acc.type === "CASH";
    } else {
      return acc.type !== "CASH";
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        {/* ... existing header ... */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            Registrar Pago - {invoice.code}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <Receipt className="size-12" />
            </div>
            <div className="space-y-1 relative">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <CircleDollarSign className="size-3" /> Total Factura
              </span>
              <div className="font-black text-xl font-mono-data">
                {formatCurrency(
                  Number(invoice.total),
                  invoice.currency?.symbol || "$",
                )}
              </div>
            </div>
            <div className="space-y-1 relative">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />{" "}
                Saldo Pendiente
              </span>
              <div className="font-black text-xl font-mono-data text-primary">
                {formatCurrency(remaining, invoice.currency?.symbol || "$")}
              </div>
            </div>
            {isRetention && (
              <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-primary/20">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                  <span>
                    Base Imponible: {formatCurrency(invoice.totalBase)}
                  </span>
                  <span>Total IVA: {formatCurrency(invoice.totalTax)}</span>
                </div>
              </div>
            )}

            {igtfAmount > 0 && (
              <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-yellow-200/50 bg-yellow-500/5 -mx-4 px-4 pb-2">
                <div className="flex justify-between items-center text-yellow-700 dark:text-yellow-500 font-bold text-xs uppercase tracking-wider">
                  <span>IGTF (3%):</span>
                  <span>
                    +{formatCurrency(igtfAmount, invoice.currency?.symbol)}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1 italic">
                  Aplica por pago en Divisas ({selectedMethod?.name})
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select value={methodId} onValueChange={setMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione método" />
              </SelectTrigger>
              <SelectContent>
                {availableMethods?.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isRetention && !isBalancePayment && (
            <div className="space-y-2">
              <Label>
                Cuenta Destino
                {selectedMethod?.allowedAccounts &&
                  selectedMethod.allowedAccounts.length > 0 && (
                    <span className="text-xs text-blue-500 ml-2">
                      (Restringida por Configuración)
                    </span>
                  )}
              </Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione Cuenta Bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAccounts?.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No hay cuentas habilitadas para este método en{" "}
                      {invoice.currency?.code}
                    </div>
                  ) : (
                    filteredAccounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {isRetention && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Comprobante</Label>
                <DatePicker
                  value={voucherDate}
                  onChange={(v) => setVoucherDate(v)}
                  placeholder="Fecha comprobante"
                />
              </div>
              <div className="space-y-2">
                <Label>Base Imponible Doc.</Label>
                <Input
                  type="number"
                  value={taxBase}
                  onChange={(e) => setTaxBase(e.target.value)}
                  disabled // Auto-filled from invoice usually
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto {isRetention ? "Retenido" : "a Pagar"}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRetention ? "Nro. Comprobante" : "Referencia"}</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={isRetention ? "20240001..." : "Op #123456"}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto px-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-8"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {igtfAmount > 0
                ? `Pagar ${formatCurrency(
                    Number(amount) + igtfAmount,
                    invoice.currency?.symbol,
                  )}`
                : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
