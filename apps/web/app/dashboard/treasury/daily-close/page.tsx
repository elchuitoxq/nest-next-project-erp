"use client";

import { useState } from "react";
import { useDailyClose } from "@/modules/treasury/hooks/use-treasury";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Loader2,
  Printer,
  Calendar as CalendarIcon,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  onClick={() => router.push("/dashboard/treasury")}
                >
                  Caja y Bancos
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Cierre de Caja</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 print:py-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="print:hidden"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Cierre de Caja
              </h1>
              <p className="text-muted-foreground">
                Reporte de ingresos del día{" "}
                {format(new Date(date), "PPP", { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <div className="flex items-center gap-2 border rounded-md px-3 py-1 bg-background">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm"
              />
            </div>

            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Bolívares (VES)
                  </CardTitle>
                  <span className="text-2xl">🇻🇪</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data?.totals?.VES || 0, "Bs")}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Dólares (USD)
                  </CardTitle>
                  <span className="text-2xl">🇺🇸</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data?.totals?.USD || 0, "$")}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="print:shadow-none print:border-none">
              <CardHeader>
                <CardTitle>Desglose por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead className="text-center">
                        Transacciones
                      </TableHead>
                      <TableHead className="text-right">
                        Total Recibido
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.byMethod?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.method}
                        </TableCell>
                        <TableCell>{item.currency}</TableCell>
                        <TableCell className="text-center">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            item.amount,
                            item.currency === "VES" ? "Bs" : "$",
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.byMethod?.length && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No hay movimientos registrados en esta fecha.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="hidden print:block mt-8 text-center text-sm text-muted-foreground">
              <p>Generado automáticmente por el sistema ERP.</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
