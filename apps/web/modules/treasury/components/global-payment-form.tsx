"use client";

import { useState, useMemo, useEffect } from "react";
import { usePartners } from "@/modules/partners/hooks/use-partners";
import { PartnerCombobox } from "@/modules/partners/components/partner-combobox";
import { useInvoices } from "@/modules/billing/hooks/use-invoices";
import {
  usePaymentMethods,
  useRegisterPayment,
} from "@/modules/treasury/hooks/use-treasury";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { Loader2, Calculator, List, Plus, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { useBankAccounts } from "@/modules/treasury/hooks/use-bank-accounts";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BalancePicker } from "./balance-picker";
import { InvoiceDetailsDialog } from "@/modules/billing/components/invoice-details-dialog";
import { Eye } from "lucide-react";
import { GuideCard } from "@/components/guide/guide-card";
import { GuideHint } from "@/components/guide/guide-hint";

interface Currency {
  id: string;
  code: string;
  symbol: string;
  isBase: boolean;
}

export function GlobalPaymentForm() {
  const [partnerId, setPartnerId] = useState("");
  const [operationType, setOperationType] = useState<"SALE" | "PURCHASE">(
    "SALE",
  );

  const { data: invoicesResponse } = useInvoices({
    partnerId: partnerId || undefined,
    type: operationType,
    status: ["POSTED", "PARTIALLY_PAID"],
    limit: 100,
  });

  const allInvoices = invoicesResponse?.data || [];

  const { data: methods } = usePaymentMethods();
  const { data: bankAccounts } = useBankAccounts();
  const { mutate: registerPayment, isPending } = useRegisterPayment();

  // Fetch currencies and rates
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<Currency[]>("/settings/currencies");
      return data;
    },
  });

  const { data: latestRates } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<any[]>(
        "/settings/currencies/rates/latest",
      );
      return data;
    },
  });

  // Form State
  const [methodId, setMethodId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [exchangeRateInput, setExchangeRateInput] = useState("");

  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Detail Modal State
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const clientInvoices = useMemo(() => {
    if (!partnerId || !allInvoices) return [];
    return allInvoices
      .filter(
        (inv) =>
          inv.partnerId === partnerId &&
          (inv.status === "POSTED" || inv.status === "PARTIALLY_PAID") &&
          Number(inv.total) > 0,
      )
      .sort(
        (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime(),
      );
  }, [allInvoices, partnerId]);

  const commonRate = useMemo(() => {
    if (clientInvoices.length === 0) return null;
    // Normalize to number
    const firstRate = Number(clientInvoices[0].exchangeRate || 0);
    if (!firstRate) return null;

    const allMatch = clientInvoices.every((inv) => {
      const r = Number(inv.exchangeRate || 0);
      return Math.abs(r - firstRate) < 0.001;
    });

    return allMatch ? firstRate : null;
  }, [clientInvoices]);

  const effectiveRate = useMemo(() => {
    const rateVal = exchangeRateInput ? Number(exchangeRateInput) : 0;
    if (rateVal > 0) return rateVal;

    const vesCurrency = currencies?.find((c) => c.code === "VES");
    if (!vesCurrency) return 1;

    const rateObj = latestRates?.find((r) => r.currencyId === vesCurrency.id);
    return rateObj ? Number(rateObj.rate) : 1;
  }, [exchangeRateInput, latestRates, currencies]);

  // Derived Values
  const selectedMethod = methods?.find((m) => m.id === methodId);
  const paymentCurrency = currencies?.find((c) => c.id === currencyId);
  const isBalanceMethod = selectedMethod?.code?.startsWith("BALANCE");
  const isRetention = selectedMethod?.code?.startsWith("RET_");
  const selectedBankAccount = bankAccounts?.find((a) => a.id === bankAccountId);

  const totalClientDebt = useMemo(() => {
    return clientInvoices.reduce((acc, inv) => {
      const paid = Number((inv as any).paidAmount || 0);
      const pending = Number(inv.total) - paid;

      const invCurrencyCode = inv.currency?.code || "USD";
      const targetCurrencyCode = paymentCurrency?.code || invCurrencyCode;

      if (invCurrencyCode === targetCurrencyCode) return acc + pending;

      // Use invoice specific rate or fallback to effective global rate (which is now just for reference)
      const invRate = Number(inv.exchangeRate) || effectiveRate;

      if (invCurrencyCode === "USD" && targetCurrencyCode === "VES") {
        return acc + pending * invRate;
      }
      if (invCurrencyCode === "VES" && targetCurrencyCode === "USD") {
        return acc + pending / invRate;
      }

      return acc + pending;
    }, 0);
  }, [clientInvoices, paymentCurrency, effectiveRate]);

  const filteredAccounts = useMemo(() => {
    let accs = bankAccounts || [];
    if (currencyId) {
      accs = accs.filter((acc) => acc.currencyId === currencyId);
    }
    if (selectedMethod?.allowedAccounts?.length) {
      const allowedIds = selectedMethod.allowedAccounts.map(
        (a: any) => a.bankAccountId,
      );
      accs = accs.filter((acc) => allowedIds.includes(acc.id));
    }
    return accs;
  }, [bankAccounts, currencyId, selectedMethod]);

  useEffect(() => {
    if (selectedMethod?.currencyId) {
      setCurrencyId(selectedMethod.currencyId);
    }
  }, [selectedMethod]);

  useEffect(() => {
    if (commonRate) {
      setExchangeRateInput(commonRate.toString());
      return;
    }
    if (latestRates && currencies && !exchangeRateInput) {
      const vesCurrency = currencies.find((c) => c.code === "VES");
      const rateObj = latestRates.find((r) => r.currencyId === vesCurrency?.id);
      if (rateObj) setExchangeRateInput(rateObj.rate);
    }
  }, [latestRates, currencies, commonRate]);

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const totalAmountNum = Number(amount) || 0;
  const remainingAmount = Math.max(0, totalAmountNum - totalAllocated);
  const isOverAllocated = totalAllocated > totalAmountNum + 0.01;

  const handleAutoDistribute = () => {
    if (!totalAmountNum) {
      toast.error("Debe ingresar un monto antes de distribuir");
      return;
    }
    let available = totalAmountNum;
    const newAllocations: Record<string, number> = {};

    for (const inv of clientInvoices) {
      if (available <= 0.001) break;

      // Use the pre-calculated paidAmount from backend if available
      const paidAlready = Number((inv as any).paidAmount || 0);
      const pending = Number(inv.total) - paidAlready;

      let pendingInPaymentCurrency = pending;
      const invCurrencyCode = inv.currency?.code || "USD";
      const payCurrencyCode = paymentCurrency?.code || "USD";

      // Use invoice specific rate
      const invRate = Number(inv.exchangeRate) || effectiveRate;

      if (invCurrencyCode === "USD" && payCurrencyCode === "VES") {
        pendingInPaymentCurrency = pending * invRate;
      } else if (invCurrencyCode === "VES" && payCurrencyCode === "USD") {
        pendingInPaymentCurrency = pending / invRate;
      }

      const toPay = Math.min(available, pendingInPaymentCurrency);

      if (toPay > 0.001) {
        newAllocations[inv.id] = Number(toPay.toFixed(2));
        available -= toPay;
      }
    }
    setAllocations(newAllocations);
    toast.info("Montos distribuidos automáticamente.");
  };

  const clearAllocations = () => {
    setAllocations({});
    toast.info("Asignaciones limpiadas correctamente.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiresBankAccount = !isBalanceMethod && !isRetention;

    if (!partnerId || !methodId || !amount) {
      toast.error("Por favor complete todos los campos obligatorios.");
      return;
    }

    if (requiresBankAccount && !bankAccountId) {
      toast.error("Debe seleccionar una cuenta bancaria de destino.");
      return;
    }

    if (isOverAllocated) {
      toast.error("El monto asignado no puede superar el pago total.");
      return;
    }

    const payloadAllocations = Object.entries(allocations)
      .map(([invId, amt]) => ({
        invoiceId: invId,
        amount: amt,
      }))
      .filter((a) => a.amount > 0);

    registerPayment(
      {
        partnerId,
        methodId,
        currencyId: currencyId || clientInvoices[0]?.currencyId,
        amount,
        exchangeRate: exchangeRateInput || effectiveRate.toString(),
        reference:
          reference ||
          (isBalanceMethod
            ? `USO-SALDO-${Date.now().toString().slice(-4)}`
            : ""),
        bankAccountId: bankAccountId || undefined,
        allocations: payloadAllocations,
        type: operationType === "SALE" ? "INCOME" : "EXPENSE",
      },
      {
        onSuccess: () => {
          toast.success("Pago registrado correctamente");
          setAllocations({});
          setAmount("");
          setReference("");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Error al registrar");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <GuideCard title="Protección de Tasa Cambiaria & Pagos" variant="info">
        <p className="mb-2">
          Para proteger la integridad financiera, el sistema{" "}
          <strong>bloquea automáticamente la tasa de cambio</strong> cuando
          detecta que todas las facturas seleccionadas comparten la misma tasa
          histórica.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Tasa FIJA:</strong> Se usa obligatoriamente la tasa de la
            factura original. Esto evita generar diferencias en cambio
            (pérdidas/ganancias) artificiales.
          </li>
          <li>
            <strong>Tasa MÚLTIPLE:</strong> Si mezclas facturas con diferentes
            tasas, deberás definir una tasa manual, pero esto generará ajustes
            contables complejos.{" "}
            <em>Se recomienda procesar por lotes de misma tasa.</em>
          </li>
        </ul>
      </GuideCard>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left Column: Form Details (8 cols) */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          <div className="flex justify-start gap-2 bg-gray-100/50 p-1 rounded-lg w-fit">
            <Button
              type="button"
              variant={operationType === "SALE" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setOperationType("SALE");
                setAllocations({});
                setPartnerId("");
                setAmount("");
              }}
              className={cn(
                "h-8 text-xs font-bold transition-all",
                operationType === "SALE" &&
                  "bg-teal-600 hover:bg-teal-700 shadow-sm",
              )}
            >
              Gestión de Cobranzas
            </Button>
            <Button
              type="button"
              variant={operationType === "PURCHASE" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setOperationType("PURCHASE");
                setAllocations({});
                setPartnerId("");
                setAmount("");
              }}
              className={cn(
                "h-8 text-xs font-bold transition-all",
                operationType === "PURCHASE" &&
                  "bg-orange-600 hover:bg-orange-700 shadow-sm",
              )}
            >
              Gestión de Pagos
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          operationType === "SALE"
                            ? "bg-teal-500"
                            : "bg-orange-500",
                        )}
                      />
                      {operationType === "SALE" ? "Cliente" : "Proveedor"}
                    </Label>
                    <PartnerCombobox
                      value={partnerId}
                      onChange={setPartnerId}
                      type={operationType === "SALE" ? "CUSTOMER" : "SUPPLIER"}
                    />
                    {partnerId && (
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          Saldo Pendiente Total (
                          {paymentCurrency?.code ||
                            clientInvoices[0]?.currency?.code ||
                            "USD"}
                          )
                        </span>
                        <span
                          className={cn(
                            "text-xs font-black",
                            operationType === "SALE"
                              ? "text-red-600"
                              : "text-orange-600",
                          )}
                        >
                          {formatCurrency(
                            totalClientDebt,
                            paymentCurrency?.code ||
                              clientInvoices[0]?.currency?.code ||
                              "USD",
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Método de Pago
                      </Label>
                      <Select
                        value={methodId}
                        onValueChange={(val) => {
                          setMethodId(val);
                          setBankAccountId("");
                        }}
                      >
                        <SelectTrigger className="bg-white/50 border-gray-200">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {methods?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isBalanceMethod ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Uso de Saldo a Favor
                        </Label>
                        {partnerId && currencyId ? (
                          <BalancePicker
                            partnerId={partnerId}
                            currencyId={currencyId}
                            amountToPay={totalAmountNum}
                            onApply={(val) => {
                              // Set the amount to the available balance
                              // usually user wants to cover the debt or use all balance
                              const totalDebt = clientInvoices.reduce(
                                (acc, inv) => {
                                  const paid = Number(
                                    (inv as any).paidAmount || 0,
                                  );
                                  return acc + (Number(inv.total) - paid);
                                },
                                0,
                              );

                              // Handle manual rate calculation for totalDebt if needed,
                              // but easiest is just to let user click "Usar Todo"
                              // and then they can adjust if needed.
                              setAmount(val.toFixed(2));
                              toast.info("Saldo aplicado al monto del pago");
                            }}
                          />
                        ) : (
                          <div className="text-[10px] text-muted-foreground p-3 border border-dashed rounded-lg bg-gray-50/50 flex flex-col items-center justify-center text-center h-[115px]">
                            <ArrowLeftRight className="h-5 w-5 mb-1 opacity-20" />
                            Seleccione cliente y moneda para ver créditos.
                          </div>
                        )}
                      </div>
                    ) : isRetention ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Detalles de Retención
                        </Label>
                        <div className="p-3 border border-dashed rounded-md bg-gray-50 text-xs text-center text-gray-500 flex flex-col justify-center h-[72px]">
                          <span>
                            No requiere cuenta bancaria. <br />
                            Ingrese Nro. Comprobante en Referencia.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Cuenta Destino
                        </Label>
                        <Select
                          value={bankAccountId}
                          onValueChange={setBankAccountId}
                        >
                          <SelectTrigger className="bg-white/50 border-gray-200">
                            <SelectValue placeholder="Destino..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredAccounts?.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name} ({acc.currency?.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedBankAccount && (
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                              Saldo Actual
                            </span>
                            <span className="text-xs font-black text-teal-600">
                              {formatCurrency(
                                Number(selectedBankAccount.currentBalance),
                                selectedBankAccount.currency?.code,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Referencia
                      </Label>
                      <Input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={
                          isBalanceMethod ? "Automática" : "EJ: 123456"
                        }
                        disabled={isBalanceMethod}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label className="text-sm font-semibold">
                          Tasa de Cambio
                        </Label>
                        <GuideHint text="Si aparece 'FIJA', es la tasa histórica del documento. No se puede editar para garantizar que se pague exactamente la deuda original en divisas." />
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={exchangeRateInput}
                          readOnly
                          className="pl-9 bg-gray-100/50 text-gray-500 cursor-not-allowed font-medium"
                        />
                        <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        {commonRate ? (
                          <span className="absolute right-3 top-2.5 text-[10px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100">
                            FIJA
                          </span>
                        ) : (
                          <span className="absolute right-3 top-2.5 text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100">
                            MÚLTIPLE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {commonRate
                          ? "* Tasa fijada por el documento."
                          : "* Múltiples tasas aplicadas según factura."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex justify-between">
                      {operationType === "SALE"
                        ? "Monto Recibido"
                        : "Monto a Pagar"}
                      {paymentCurrency && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded uppercase",
                            operationType === "SALE"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-orange-100 text-orange-700",
                          )}
                        >
                          {paymentCurrency.code}
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        className={cn(
                          "text-2xl font-black h-14 bg-white/50 border-gray-300 transition-all focus:ring-4",
                          operationType === "SALE"
                            ? "focus:ring-teal-100"
                            : "focus:ring-orange-100",
                        )}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-4">
                        <span className="text-xl font-bold text-gray-400">
                          {paymentCurrency?.symbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Glassmorphism Summary Panel */}
                  <div
                    className={cn(
                      "rounded-xl p-5 space-y-3 transition-all duration-300",
                      isOverAllocated
                        ? "bg-red-50/80 ring-1 ring-red-200"
                        : operationType === "SALE"
                          ? "bg-gradient-to-br from-teal-50/80 to-emerald-50/80 ring-1 ring-teal-100 shadow-sm"
                          : "bg-gradient-to-br from-amber-50/80 to-orange-50/80 ring-1 ring-amber-100 shadow-sm",
                    )}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">
                        Total Aplicado
                      </span>
                      <span
                        className={cn(
                          "font-black text-lg",
                          operationType === "SALE"
                            ? "text-teal-700"
                            : "text-orange-700",
                        )}
                      >
                        {formatCurrency(
                          totalAllocated,
                          paymentCurrency?.code || "Bs",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-60">
                      <span className="text-gray-500">
                        Excedente (Gana Crédito)
                      </span>
                      <span className="font-bold text-gray-700">
                        {formatCurrency(
                          remainingAmount,
                          paymentCurrency?.code || "Bs",
                        )}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200/50 flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total del Pago
                      </span>
                      <span
                        className={cn(
                          "font-black text-xl tracking-tighter",
                          operationType === "SALE"
                            ? "text-teal-900"
                            : "text-orange-900",
                        )}
                      >
                        {formatCurrency(
                          totalAmountNum,
                          paymentCurrency?.code || "Bs",
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 h-10 font-semibold"
                      onClick={handleAutoDistribute}
                      disabled={!totalAmountNum || clientInvoices.length === 0}
                    >
                      <List className="h-4 w-4" />
                      Distribuir Automáticamente
                    </Button>
                    <GuideHint
                      text="Asigna el monto disponible a las facturas más antiguas primero (FIFO) hasta agotarlo."
                      className="mr-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2 h-10 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={clearAllocations}
                    >
                      Limpiar Asignaciones
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Invoice Pile (Stacked in Mobile) */}
        <div className="lg:col-span-12 xl:col-span-4 h-[600px] flex flex-col">
          <div className="flex-1 flex flex-col border rounded-md bg-card overflow-hidden">
            <div className="p-4 border-b bg-muted/40 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ArrowLeftRight
                    className={cn(
                      "h-4 w-4",
                      operationType === "SALE"
                        ? "text-teal-500"
                        : "text-orange-500",
                    )}
                  />
                  {operationType === "SALE"
                    ? "Pila de Pendientes"
                    : "Cuentas por Pagar"}
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {operationType === "SALE"
                    ? "FACTURAS POR COBRAR"
                    : "FACTURAS DE PROVEEDOR"}
                </p>
              </div>
              <div className="bg-white border rounded px-2 py-1 shadow-sm">
                <span
                  className={cn(
                    "text-xs font-black",
                    operationType === "SALE"
                      ? "text-teal-600"
                      : "text-orange-600",
                  )}
                >
                  {clientInvoices.length} FACTURAS
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
              {clientInvoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <List className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">
                    {operationType === "SALE"
                      ? "Seleccione un cliente para ver sus deudas."
                      : "Seleccione un proveedor para ver sus facturas."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {clientInvoices.map((inv) => {
                    const paidAlready = Number((inv as any).paidAmount || 0);
                    const pendingBase = Number(inv.total) - paidAlready;
                    const currentAlloc = allocations[inv.id] || 0;

                    let pendingEquiv = pendingBase;
                    const invCurrencyCode = inv.currency?.code || "USD";
                    const payCurrencyCode = paymentCurrency?.code || "USD";

                    const invRate = Number(inv.exchangeRate) || effectiveRate;

                    if (invCurrencyCode === "USD" && payCurrencyCode === "VES")
                      pendingEquiv = pendingBase * invRate;
                    else if (
                      invCurrencyCode === "VES" &&
                      payCurrencyCode === "USD"
                    )
                      pendingEquiv = pendingBase / invRate;

                    const isPayingThis = currentAlloc > 0;

                    return (
                      <div
                        key={inv.id}
                        className={cn(
                          "p-4 transition-colors",
                          isPayingThis
                            ? operationType === "SALE"
                              ? "bg-teal-50/50"
                              : "bg-orange-50/50"
                            : "hover:bg-gray-50/30",
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                "text-xs font-black cursor-pointer hover:underline",
                                operationType === "SALE"
                                  ? "text-teal-600"
                                  : "text-orange-600",
                              )}
                              onClick={() => {
                                setDetailInvoiceId(inv.id);
                                setIsDetailOpen(true);
                              }}
                            >
                              {inv.code}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              {inv.date
                                ? new Date(inv.date).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-blue-600"
                              onClick={() => {
                                setDetailInvoiceId(inv.id);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <div className="text-right">
                              <div className="text-xs font-bold text-gray-900">
                                {formatCurrency(
                                  pendingBase,
                                  inv.currency?.code,
                                )}
                              </div>
                              {payCurrencyCode !== invCurrencyCode && (
                                <div className="text-[9px] text-muted-foreground font-semibold">
                                  ~{" "}
                                  {formatCurrency(
                                    pendingEquiv,
                                    paymentCurrency?.code,
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2 text-[10px] font-bold text-gray-400">
                              {paymentCurrency?.symbol || "$"}
                            </span>
                            <Input
                              type="number"
                              className={cn(
                                "h-9 pl-7 text-right font-bold text-sm bg-white/80",
                                isPayingThis
                                  ? operationType === "SALE"
                                    ? "border-teal-300 ring-2 ring-teal-50"
                                    : "border-orange-300 ring-2 ring-orange-50"
                                  : "border-gray-200",
                              )}
                              value={currentAlloc || ""}
                              placeholder="0.00"
                              onChange={(e) => {
                                const val = Math.min(
                                  Number(e.target.value),
                                  Number(pendingEquiv.toFixed(2)) + 0.05,
                                );
                                setAllocations((prev) => ({
                                  ...prev,
                                  [inv.id]: val,
                                }));
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-9 w-9 text-gray-400 transition-colors",
                              operationType === "SALE"
                                ? "hover:text-teal-500"
                                : "hover:text-orange-500",
                            )}
                            onClick={() => {
                              setAllocations((prev) => ({
                                ...prev,
                                [inv.id]: Number(pendingEquiv.toFixed(2)),
                              }));
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/40 border-t">
              <Button
                type="submit"
                className={cn(
                  "w-full h-12 text-lg font-black shadow-lg transition-all active:scale-[0.98]",
                  operationType === "SALE"
                    ? "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
                    : "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20",
                )}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <span className="uppercase tracking-widest">
                    {operationType === "SALE"
                      ? "Procesar Cobranza"
                      : "Registrar Pago"}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
      <InvoiceDetailsDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        invoice={clientInvoices.find((i) => i.id === detailInvoiceId)}
      />
    </div>
  );
}
