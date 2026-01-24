"use client";

import { ExchangeRateWidget } from "@/modules/treasury/components/exchange-rate-widget";
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
// import { useQuery } from "@tanstack/react-query";
// import api from "@/lib/api";
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

export default function CurrenciesPage() {
  const { data: currencies, isLoading } = useCurrencies();

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
                <BreadcrumbLink href="#">Configuración</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Monedas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
          <div className="md:col-span-2 space-y-6">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Tasa Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : currencies?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay monedas registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currencies?.map((currency) => (
                      <TableRow key={currency.id}>
                        <TableCell className="font-medium">
                          {currency.code}
                        </TableCell>
                        <TableCell>{currency.name}</TableCell>
                        <TableCell>{currency.symbol}</TableCell>
                        <TableCell>
                          {currency.isBase ? (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Base (Principal)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              Extranjera
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency.isBase ? "1.00" : "Variable"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div>
            <ExchangeRateWidget />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
