"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, cn } from "@/lib/utils";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
// Imports removed

import { useBankAccounts } from "@/modules/treasury/hooks/use-bank-accounts";

export function GlobalPaymentForm() {
  const { data: partners } = usePartners();
  const { data: allInvoices } = useInvoices();
  const { data: methods } = usePaymentMethods();
  const { data: bankAccounts } = useBankAccounts();
  const { mutate: registerPayment, isPending } = useRegisterPayment();

  // Form State
  const [partnerId, setPartnerId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [currencyId, setCurrencyId] = useState(""); // Should depend on method or invoice?
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [openPartner, setOpenPartner] = useState(false);

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
          Number(inv.total) > 0, // Safety check
      )
      .sort(
        (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime(),
      ); // Oldest first
  }, [allInvoices, partnerId]);

  // Derived Values
  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remainingAmount = Math.max(0, Number(amount) - totalAllocated);

  // Auto Allocate Handler
  const handleAutoDistribute = () => {
    if (!amount) return;
    let available = Number(amount);
    const newAllocations: Record<string, number> = {};

    for (const inv of clientInvoices) {
      if (available <= 0) break;

      const paidAlready =
        inv.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const pending = Number(inv.total) - paidAlready;

      // We also need to check currency consistency if we want strictly correct math
      // For now assuming 1:1 if currency matches.

      const toPay = Math.min(available, pending);
      if (toPay > 0) {
        newAllocations[inv.id] = toPay;
        available -= toPay;
      }
    }
    setAllocations(newAllocations);
  };

  const selectedMethod = methods?.find((m) => m.id === methodId);

  // Filter accounts by selected currency (if set)
  const filteredAccounts = useMemo(() => {
    if (!currencyId) return bankAccounts;
    return bankAccounts?.filter((acc) => acc.currencyId === currencyId);
  }, [bankAccounts, currencyId]);

  // Effect: Auto-select account if only one matches currency
  // (Optional, maybe annoying if user wants to change)

  // Effect: Auto-set currency if method has restricted currency
  useMemo(() => {
    if (selectedMethod?.currencyId) {
      setCurrencyId(selectedMethod.currencyId);
    }
  }, [selectedMethod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !methodId || !amount) {
      toast.error("Complete los campos requeridos");
      return;
    }

    if (totalAllocated > Number(amount)) {
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
        currencyId: currencyId || clientInvoices[0]?.currencyId, // Fallback to invoice currency if mixed
        amount,
        reference,
        bankAccountId, // New Field
        allocations: payloadAllocations,
        // Legacy invoiceId is omitted, implying Pure Allocation mode
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

              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ref. Bancaria"
                />
              </div>

              <div className="space-y-2">
                <Label>Monto Total Recibido</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="text-lg font-bold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Status Card */}
              <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monto Recibido:</span>
                  <span className="font-medium">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Asignado:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Por Asignar (Crédito):</span>
                  <span className={remainingAmount > 0 ? "text-blue-600" : ""}>
                    {formatCurrency(remainingAmount)}
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
                {selectedMethod?.currencyId ? (
                  <span className="text-xs text-muted-foreground">
                    Moneda Fija:{" "}
                    {methods?.find((m) => m.id === selectedMethod.currencyId)
                      ?.code || "..."}
                  </span>
                ) : null}
              </div>

              <div className="flex-1 overflow-auto p-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[100px]">Factura</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead className="text-right w-[120px]">
                        Abonar
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
                        const pending = Number(inv.total) - paid;
                        const currentAlloc = allocations[inv.id] || 0;

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
                              {formatCurrency(pending, inv.currency?.symbol)}
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
                                    pending,
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
