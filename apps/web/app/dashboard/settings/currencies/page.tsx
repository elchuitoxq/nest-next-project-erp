"use client";

import { ExchangeRateWidget } from "@/modules/treasury/components/exchange-rate-widget";
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
import { Loader2 } from "lucide-react";
import { useCurrencies } from "@/modules/settings/currencies/hooks/use-currencies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

export default function CurrenciesPage() {
  const { data: currencies, isLoading } = useCurrencies();
  const [search, setSearch] = useState("");

  const filteredCurrencies =
    currencies?.filter((currency) => {
      const term = search.toLowerCase();
      return (
        currency.code.toLowerCase().includes(term) ||
        currency.name.toLowerCase().includes(term) ||
        currency.symbol.toLowerCase().includes(term)
      );
    }) || [];

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
              Monedas y Tasas
            </h1>
            <p className="text-muted-foreground">
              Gestiona las monedas disponibles y sus tasas de cambio.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Currencies List */}
          <div className="md:col-span-2">
            <Card className="border premium-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monedas Disponibles</CardTitle>
                    <CardDescription>
                      Listado maestro de divisas del sistema.
                    </CardDescription>
                  </div>
                  <div className="w-[250px]">
                    <Input
                      placeholder="Buscar moneda..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-muted/30"
                    />
                  </div>
                </div>
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
                        <TableHead className="px-4">Símbolo</TableHead>
                        <TableHead className="px-4">Tipo</TableHead>
                        <TableHead className="text-right px-4">
                          Tasa Actual
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="wait">
                        {isLoading || (filteredCurrencies.length ?? 0) > 0 ? (
                          filteredCurrencies.map((currency, index) => (
                            <motion.tr
                              key={currency.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              exit={{
                                opacity: 0,
                                transition: { duration: 0.2 },
                              }}
                              className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                            >
                              <TableCell className="font-mono-data text-xs font-bold text-primary py-3 px-4">
                                {currency.code}
                              </TableCell>
                              <TableCell className="font-bold text-sm py-3 px-4">
                                {currency.name}
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <span className="font-mono-data bg-muted px-2 py-1 rounded text-xs font-bold">
                                  {currency.symbol}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                {currency.isBase ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-bold bg-green-500/10 text-green-600 border-green-200"
                                  >
                                    Base (Principal)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-bold bg-blue-500/10 text-blue-600 border-blue-200"
                                  >
                                    Extranjera
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right py-3 px-4 font-mono-data text-xs font-bold">
                                {currency.isBase ? "1.0000" : "Variable"}
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
                              colSpan={5}
                              className="text-center text-muted-foreground py-20 italic"
                            >
                              No se encontraron monedas.
                            </TableCell>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            <ExchangeRateWidget />
          </div>
        </div>
      </motion.div>
    </SidebarInset>
  );
}
