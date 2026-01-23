"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { FiscalBookTable } from "@/modules/billing/components/fiscal-book-table";
import { useFiscalBook } from "@/modules/billing/hooks/use-fiscal-book";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
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

export default function FiscalBookPage() {
  const [month, setMonth] = useState<string>(
    (new Date().getMonth() + 1).toString(),
  );
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const { data, isLoading } = useFiscalBook(Number(month), Number(year));

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

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
                <BreadcrumbPage>Libro de Ventas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          <DashboardHeader
            title="Libro de Ventas"
            description="Reporte fiscal mensual de ventas y retenciones (Formato SENIAT)."
          >
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DashboardHeader>

          <div className="flex gap-4 items-center bg-card p-4 rounded-lg border">
            <div className="w-[180px]">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[120px]">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FiscalBookTable data={data || []} />
          )}
        </div>
      </div>
    </SidebarInset>
  );
}
