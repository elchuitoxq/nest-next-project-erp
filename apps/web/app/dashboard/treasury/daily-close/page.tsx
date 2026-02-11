"use client";

import { useState } from "react";
import { useDailyClose } from "@/modules/treasury/hooks/use-treasury";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

import { motion, AnimatePresence } from "framer-motion";

export default function DailyClosePage() {
  const router = useRouter();
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const { data, isLoading } = useDailyClose(date);

  const handlePrint = () => {
    window.print();
  };

  return (
    <SidebarInset>
      <AppHeader className="print:hidden" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-6 p-4 pt-0"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 print:py-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="print:hidden rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Cierre de Caja
              </h2>
              <p className="text-muted-foreground text-sm">
                Reporte de ingresos del día{" "}
                <span className="font-semibold text-blue-600">
                  {format(new Date(date), "PPP", { locale: es })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <DatePicker
              value={date}
              onChange={(v) => setDate(v)}
              maxDate={new Date()}
              placeholder="Seleccionar fecha"
              className="w-[220px]"
            />

            <Button
              variant="outline"
              onClick={handlePrint}
              className="rounded-xl border-gray-200 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 opacity-50" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Generando reporte...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
                    Total Bolívares (VES)
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                    🇻🇪
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-emerald-900">
                    {formatCurrency(data?.totals?.VES || 0, "Bs")}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-white ring-1 ring-blue-100/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-blue-800 uppercase tracking-wider">
                    Total Dólares (USD)
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                    🇺🇸
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-blue-900">
                    {formatCurrency(data?.totals?.USD || 0, "$")}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border premium-shadow print:shadow-none print:ring-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Desglose por Método de Pago
                </CardTitle>
                <CardDescription>
                  Resumen detallado de ingresos por canal de recaudo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border relative">
                  <Table>
                    <TableHeader className="bg-gray-100/50">
                      <TableRow>
                        <TableHead className="font-bold">
                          Método de Pago
                        </TableHead>
                        <TableHead className="font-bold">Moneda</TableHead>
                        <TableHead className="text-center font-bold">
                          Transacciones
                        </TableHead>
                        <TableHead className="text-right font-bold">
                          Total Recibido
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="wait">
                        {data?.byMethod?.map((item: any, idx: number) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: { delay: idx * 0.05 },
                            }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className="hover:bg-blue-50/30 transition-colors border-b last:border-0"
                          >
                            <TableCell className="font-medium">
                              {item.method}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold">
                                {item.currency}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono-data">
                              {item.count}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono-data text-gray-900">
                              {formatCurrency(
                                item.amount,
                                item.currency === "VES" ? "Bs" : "$",
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                        {!data?.byMethod?.length && (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <TableCell
                              colSpan={4}
                              className="text-center py-12 text-muted-foreground italic"
                            >
                              No hay movimientos registrados en esta fecha.
                            </TableCell>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="hidden print:block mt-12 text-center text-[10px] text-gray-400 border-t pt-4">
              <p className="uppercase tracking-tighter">
                Sistema ERP - Reporte de Cierre de Caja
              </p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </motion.div>
    </SidebarInset>
  );
}
