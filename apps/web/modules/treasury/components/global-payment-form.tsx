"use client";

import { useState, useMemo, useEffect } from "react";
import { usePartners } from "@/modules/partners/hooks/use-partners";
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
import { Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useBankAccounts } from "@/modules/treasury/hooks/use-bank-accounts";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Currency {
  id: string;
  code: string;
  symbol: string;
  isBase: boolean;
}

export function GlobalPaymentForm() {
  const { data: partners } = usePartners();
  const { data: allInvoices } = useInvoices();
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
      const { data } = await api.get<any[]>("/settings/currencies/rates/latest");
      return data;
    },
  });

  // Form State
  const [partnerId, setPartnerId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [exchangeRateInput, setExchangeRateInput] = useState(""); // Custom rate

  // Allocations State: Map<InvoiceId, Amount>
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Filter Invoices
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

  // Determine effective exchange rate
  const effectiveRate = useMemo(() => {
    if (exchangeRateInput) return Number(exchangeRateInput);
    
    // Find rate for VES (assuming Base is USD)
    const vesCurrency = currencies?.find(c => c.code === "VES");
    if (!vesCurrency) return 1;

    const rateObj = latestRates?.find(r => r.currencyId === vesCurrency.id);
    return rateObj ? Number(rateObj.rate) : 1;
  }, [exchangeRateInput, latestRates, currencies]);

  // Derived Values
  const selectedMethod = methods?.find((m) => m.id === methodId);
  const paymentCurrency = currencies?.find(c => c.id === currencyId);
  const isForeignCurrency = paymentCurrency?.code !== "VES"; // Simplified assumption

  // Filter accounts by selected currency
  const filteredAccounts = useMemo(() => {
    if (!currencyId) return bankAccounts;
    return bankAccounts?.filter((acc) => acc.currencyId === currencyId);
  }, [bankAccounts, currencyId]);

  // Effect: Auto-set currency if method has restricted currency
  useEffect(() => {
    if (selectedMethod?.currencyId) {
      setCurrencyId(selectedMethod.currencyId);
    }
  }, [selectedMethod]);

  // Effect: Auto-set exchange rate from system if available
  useEffect(() => {
    if (latestRates && currencies && !exchangeRateInput) {
       const vesCurrency = currencies.find(c => c.code === "VES");
       const rateObj = latestRates.find(r => r.currencyId === vesCurrency?.id);
       if (rateObj) setExchangeRateInput(rateObj.rate);
    }
  }, [latestRates, currencies]);


  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remainingAmount = Math.max(0, Number(amount) - totalAllocated);

  const handleAutoDistribute = () => {
    if (!amount) return;
    let available = Number(amount);
    const newAllocations: Record<string, number> = {};

    for (const inv of clientInvoices) {
      if (available <= 0) break;

      const paidAlready =
        inv.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const pending = Number(inv.total) - paidAlready; // Pending in Invoice Currency (usually Base/USD)

      // Conversion Logic:
      // If Payment is USD and Invoice is USD -> 1:1
      // If Payment is VES and Invoice is USD -> Convert Payment to USD (Amount / Rate)
      // If Payment is USD and Invoice is VES -> Convert Payment to VES (Amount * Rate)
      
      // Ideally, the backend handles multi-currency. 
      // For this form, we assume:
      // - Invoices are tracked in Base Currency (USD) usually.
      // - Payment Amount is entered in Payment Currency.
      
      // Let's keep it simple: The allocation amount is in PAYMENT CURRENCY units for now,
      // and we let the backend handle the cross-rate if they differ.
      // OR better: We display pending in Payment Currency equivalence.

      // If Payment is VES (Rate 352) and Invoice is $10.
      // Pending in VES = 10 * 352 = 3520 VES.
      // If I pay 2000 VES, I allocate 2000.
      
      // Determination of "Pending in Payment Currency":
      let pendingInPaymentCurrency = pending;
      
      const invCurrencyCode = inv.currency?.code || "USD"; // Default to base
      const payCurrencyCode = paymentCurrency?.code || "USD";

      if (invCurrencyCode === "USD" && payCurrencyCode === "VES") {
         pendingInPaymentCurrency = pending * effectiveRate;
      } else if (invCurrencyCode === "VES" && payCurrencyCode === "USD") {
         pendingInPaymentCurrency = pending / effectiveRate;
      }

      const toPay = Math.min(available, pendingInPaymentCurrency);
      
      if (toPay > 0.001) { // Epsilon check
        newAllocations[inv.id] = Number(toPay.toFixed(2));
        available -= toPay;
      }
    }
    setAllocations(newAllocations);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !methodId || !amount) {
      toast.error("Complete los campos requeridos");
      return;
    }

    if (totalAllocated > Number(amount) + 0.01) { // Tolerance
      toast.error("El monto asignado supera el pago total");
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
        reference,
        bankAccountId,
        allocations: payloadAllocations,
        // We might want to send the exchange rate used
        // exchangeRate: effectiveRate 
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
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Payment Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={partnerId}
                  onValueChange={(val) => {
                    setPartnerId(val);
                    setAllocations({});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientInvoices.length > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    Deuda total:{" "}
                    {formatCurrency(
                      clientInvoices.reduce((acc, inv) => {
                         const paid = inv.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
                         return acc + (Number(inv.total) - paid);
                      }, 0)
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select value={methodId} onValueChange={setMethodId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Método" />
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
                <div className="space-y-2">
                  <Label>Cuenta Destino</Label>
                  <Select
                    value={bankAccountId}
                    onValueChange={setBankAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cuenta Bancaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAccounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency?.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Referencia</Label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ref. Bancaria"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Tasa de Cambio (Bs/$)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={exchangeRateInput} 
                        onChange={(e) => setExchangeRateInput(e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                      <Calculator className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Monto Total Recibido</Label>
                  {paymentCurrency && <span className="text-xs font-bold text-primary">{paymentCurrency.code}</span>}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  className="text-lg font-bold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Status Card */}
              <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monto Recibido:</span>
                  <span className="font-medium">
                    {formatCurrency(Number(amount), paymentCurrency?.symbol)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Asignado:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(totalAllocated, paymentCurrency?.symbol)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Por Asignar (Crédito):</span>
                  <span className={remainingAmount > 0 ? "text-blue-600" : ""}>
                    {formatCurrency(remainingAmount, paymentCurrency?.symbol)}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleAutoDistribute}
                disabled={!amount || clientInvoices.length === 0}
              >
                Distribuir Automáticamente (Más antiguas primero)
              </Button>
            </div>

            {/* Right Column: Invoice Allocation */}
            <div className="border rounded-md flex flex-col h-[500px]">
              <div className="p-3 border-b bg-muted/40 font-medium text-sm flex justify-between items-center">
                <span>Facturas Pendientes ({clientInvoices.length})</span>
                {paymentCurrency && (
                  <span className="text-xs text-muted-foreground">
                    Pagando en: {paymentCurrency.code}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto p-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[100px]">Factura</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead className="text-right w-[130px]">
                        Abonar ({paymentCurrency?.symbol || "$"})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No hay facturas pendientes.
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientInvoices.map((inv) => {
                        const paid =
                          inv.payments?.reduce(
                            (s, p) => s + Number(p.amount),
                            0,
                          ) || 0;
                        const pendingBase = Number(inv.total) - paid;
                        const currentAlloc = allocations[inv.id] || 0;

                        // Calculate equivalent pending in PAYMENT currency
                        let pendingEquiv = pendingBase;
                        const invCurrencyCode = inv.currency?.code || "USD";
                        const payCurrencyCode = paymentCurrency?.code || "USD";

                        if (invCurrencyCode === "USD" && payCurrencyCode === "VES") {
                           pendingEquiv = pendingBase * effectiveRate;
                        } else if (invCurrencyCode === "VES" && payCurrencyCode === "USD") {
                           pendingEquiv = pendingBase / effectiveRate;
                        }

                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">
                              {inv.code}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {inv.date
                                ? new Date(inv.date).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div className="flex flex-col items-end">
                                <span>{formatCurrency(pendingBase, inv.currency?.symbol)}</span>
                                {payCurrencyCode !== invCurrencyCode && (
                                   <span className="text-[10px] text-muted-foreground">
                                     ~ {formatCurrency(pendingEquiv, paymentCurrency?.symbol)}
                                   </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                className="h-8 text-right"
                                value={currentAlloc || ""}
                                placeholder="0.00"
                                onChange={(e) => {
                                  const val = Math.min(
                                    Number(e.target.value),
                                    Number(pendingEquiv.toFixed(2)) + 0.05, // Slight tolerance
                                  );
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [inv.id]: val,
                                  }));
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Pago
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
