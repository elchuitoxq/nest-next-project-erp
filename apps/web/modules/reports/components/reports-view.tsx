"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fiscalReportsApi } from "../reports.api";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Download } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatCurrency, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, HelpCircle, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentDetailModal } from "./document-detail-modal";

export function ReportsView() {
  const [type, setType] = useState<"ventas" | "compras" | "liquidacion">(
    "ventas",
  );
  const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
  const [year, setYear] = useState(new Date().getFullYear() + "");
  const [fortnight, setFortnight] = useState<string>("full"); // "full", "first", "second"

  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    type: "INV" | "NC";
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fiscal-report", type, month, year, fortnight],
    queryFn: async () => {
      const fortnightParam = fortnight === "full" ? undefined : fortnight;
      if (type === "ventas") {
        return fiscalReportsApi.getLibroVentas(
          month,
          year,
          undefined,
          fortnightParam,
        );
      } else if (type === "compras") {
        return fiscalReportsApi.getLibroCompras(
          month,
          year,
          undefined,
          fortnightParam,
        );
      } else {
        return fiscalReportsApi.getFiscalSummary(
          month,
          year,
          undefined,
          fortnightParam,
        );
      }
    },
  });

  const handleExport = async () => {
    if (type === "liquidacion") return;
    if (!data || !data.items || data.items.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Libro ${type}`);

    const columns = [
      { header: "#", key: "nro_operacion", width: 5 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "RIF", key: "rif", width: 15 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Factura", key: "numero_factura", width: 15 },
      { header: "Control", key: "numero_control", width: 15 },
      {
        header: "Total",
        key: "total",
        width: 15,
        style: { numFmt: "#,##0.00" },
      },
      {
        header: "Base",
        key: "base_imponible",
        width: 15,
        style: { numFmt: "#,##0.00" },
      },
      {
        header: "IVA",
        key: "impuesto",
        width: 15,
        style: { numFmt: "#,##0.00" },
      },
      {
        header: "IVA Retenido",
        key: "iva_retenido",
        width: 15,
        style: { numFmt: "#,##0.00" },
      },
      { header: "N° Comprobante", key: "numero_comprobante", width: 20 },
    ];

    if (type === "ventas") {
      columns.push({
        header: "IGTF Percibido",
        key: "igtf_percibido",
        width: 15,
        style: { numFmt: "#,##0.00" },
      });
    }

    worksheet.columns = columns;

    data.items.forEach((row: any) => {
      const totalValue =
        row.total_ventas_incluyendo_iva || row.total_compras_incluyendo_iva;
      worksheet.addRow({
        nro_operacion: row.nro_operacion,
        fecha: new Date(row.fecha).toLocaleDateString(),
        rif: row.rif || "",
        nombre: row.nombre || "",
        numero_factura: row.numero_factura || "",
        numero_control: row.numero_control || "",
        total: Number(totalValue || 0),
        base_imponible: Number(row.base_imponible || 0),
        impuesto: Number(row.impuesto || 0),
        iva_retenido: Number(row.iva_retenido || 0),
        numero_comprobante: row.numero_comprobante || "",
        igtf_percibido: Number(row.igtf_percibido || 0),
      });
    });

    worksheet.addRow([]);
    worksheet.addRow(["RESUMEN GENERAL"]);
    if (worksheet.lastRow) worksheet.lastRow.font = { bold: true };

    if (data.summary) {
      if (type === "ventas") {
        worksheet.addRow([
          "Total Ventas Gravadas",
          Number(data.summary.total_ventas_gravadas || 0),
        ]);
        worksheet.addRow([
          "Total Base Imponible",
          Number(data.summary.total_base_imponible || 0),
        ]);
        worksheet.addRow([
          "Total Débito Fiscal (IVA)",
          Number(data.summary.total_debito_fiscal || 0),
        ]);
        worksheet.addRow([
          "Total IVA Retenido",
          Number(data.summary.total_iva_retenido || 0),
        ]);
        worksheet.addRow(["Total IGTF", Number(data.summary.total_igtf || 0)]);
      } else {
        worksheet.addRow([
          "Total Compras Gravadas",
          Number(data.summary.total_compras_gravadas || 0),
        ]);
        worksheet.addRow([
          "Total Base Imponible",
          Number(data.summary.total_base_imponible || 0),
        ]);
        worksheet.addRow([
          "Total Crédito Fiscal (IVA)",
          Number(data.summary.total_credito_fiscal || 0),
        ]);
        worksheet.addRow([
          "Total IVA Retenido a Terceros",
          Number(data.summary.total_iva_retenido_terceros || 0),
        ]);
      }
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Libro_${type}_${month}_${year}.xlsx`);
  };

  const handleDownloadTxt = async () => {
    try {
      const direction = type === "compras" ? "PURCHASE" : "SALE";
      const blob = await fiscalReportsApi.getRetencionesTxt(
        month,
        year,
        undefined,
        fortnight === "full" ? undefined : fortnight,
        direction,
      );
      saveAs(blob, `IVA_${year}${month}_${fortnight}_${direction}.txt`);
    } catch (error) {
      console.error("Failed to download TXT", error);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4"
      >
        <PageHeader
          title="Reportes Fiscales"
          description="Consulta y exportación de libros de compra y venta según normativa SENIAT."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:justify-end w-full sm:w-auto">
            {type !== "liquidacion" && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTxt}
                  className="h-9 rounded-xl px-4 w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    IVA TXT
                  </span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleExport}
                  disabled={!data || !data.items || data.items.length === 0}
                  className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white premium-shadow px-4 w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Excel
                  </span>
                </Button>
              </div>
            )}
          </div>
        </PageHeader>

        {!isLoading && data && type !== "liquidacion" && (
          <Card className="mb-4 border-green-100 bg-green-50/30 dark:bg-green-950/10">
            <CardContent className="py-3 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-400">
                  Resumen del Periodo:{" "}
                  {fortnight === "full"
                    ? "Mes Completo"
                    : fortnight === "first"
                      ? "1ra Quincena"
                      : "2da Quincena"}
                </p>
                <div className="text-xs text-green-700 dark:text-green-500 mt-1 leading-relaxed">
                  {type === "ventas" ? (
                    <>
                      Tienes{" "}
                      <strong className="font-bold">
                        {data.items?.length || 0}
                      </strong>{" "}
                      documentos para declarar.
                    </>
                  ) : (
                    <>
                      Se detectaron{" "}
                      <strong className="font-bold">
                        {data.items?.length || 0}
                      </strong>{" "}
                      compras facturadas. Monto a enterar por retenciones:{" "}
                      <strong className="font-mono">
                        {formatCurrency(
                          data.summary?.total_iva_retenido_terceros || 0,
                          "Bs",
                        )}
                      </strong>
                      .
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg">Parámetros de Consulta</CardTitle>
            <CardDescription>
              Seleccione el tipo de libro y el período fiscal.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <Tabs
                value={type}
                onValueChange={(v: any) => setType(v)}
                className="w-full md:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                  <TabsTrigger value="ventas">Ventas</TabsTrigger>
                  <TabsTrigger value="compras">Compras</TabsTrigger>
                  <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto md:ml-auto">
                <div className="space-y-1">
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-full md:w-[130px]">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {new Intl.DateTimeFormat("es", {
                            month: "short",
                          }).format(new Date(2000, m - 1, 1))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-full md:w-[90px]">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <Select
                    value={fortnight}
                    onValueChange={setFortnight}
                    disabled={type === "liquidacion"}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Mes Completo</SelectItem>
                      <SelectItem value="first">1era Quincena</SelectItem>
                      <SelectItem value="second">2da Quincena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {type === "liquidacion" ? (
            <motion.div
              key="liquidacion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {isLoading ? (
                <div className="col-span-3 flex justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : data ? (
                <>
                  <Card
                    className={cn(
                      "premium-shadow transition-all duration-500",
                      data.iva_a_pagar > 0
                        ? "border-red-200 bg-red-50/30 dark:bg-red-950/10"
                        : "border-green-200 bg-green-50/30 dark:bg-green-950/10",
                    )}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                        Cuota IVA Propio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={cn(
                          "text-3xl font-black font-mono-data mb-1",
                          data.iva_a_pagar > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400",
                        )}
                      >
                        {formatCurrency(data.iva_a_pagar || 0, "Bs")}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {data.excedente_credito > 0
                          ? `Excedente a favor: ${formatCurrency(data.excedente_credito, "Bs")}`
                          : "Monto neto a pagar"}
                      </p>
                      <div className="mt-6 space-y-2 text-sm border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Débitos Fiscales:
                          </span>
                          <span className="font-mono-data font-bold">
                            {formatCurrency(data.debitos_fiscales, "Bs")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Créditos Fiscales:
                          </span>
                          <span className="font-mono-data font-bold">
                            {formatCurrency(data.creditos_fiscales, "Bs")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-orange-600">
                          <span className="font-medium">
                            Retenciones Soportadas:
                          </span>
                          <span className="font-mono-data font-bold">
                            {formatCurrency(data.retenciones_soportadas, "Bs")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="premium-shadow border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-500 uppercase tracking-widest">
                        Retenciones a Enterar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black font-mono-data text-yellow-700 dark:text-yellow-400 mb-1">
                        {formatCurrency(data.retenciones_iva_a_enterar, "Bs")}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Total de IVA retenido a terceros en el periodo.
                      </p>
                      <div className="mt-8 p-3 rounded-lg bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-900 dark:text-yellow-400 italic">
                        "Este monto debe ser declarado y pagado íntegramente
                        según el calendario de sujetos pasivos."
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="premium-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                        IGTF Percibido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black font-mono-data text-blue-600 dark:text-blue-400 mb-1">
                        {formatCurrency(data.igtf_a_pagar, "Bs")}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Impuesto del 3% sobre cobros en divisa.
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="premium-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">
                        Vista Previa de Movimientos
                      </CardTitle>
                      <CardDescription>
                        {data?.items?.length || 0} registros encontrados para el
                        período fiscal seleccionado.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative border rounded-xl overflow-x-auto bg-white dark:bg-zinc-950">
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
                          <TableHead className="w-[50px] h-10 px-4 hidden md:table-cell">
                            #
                          </TableHead>
                          <TableHead className="w-[100px] h-10 px-4">
                            Fecha
                          </TableHead>
                          <TableHead className="w-[120px] h-10 px-4 hidden lg:table-cell">
                            RIF
                          </TableHead>
                          <TableHead className="h-10 px-4">
                            Contribuyente
                          </TableHead>
                          <TableHead className="h-10 px-4">
                            Factura / Tipo
                          </TableHead>
                          <TableHead className="text-right h-10 px-4">
                            Total
                          </TableHead>
                          <TableHead className="text-right h-10 px-4 hidden md:table-cell">
                            Base
                          </TableHead>
                          <TableHead className="text-right h-10 px-4 hidden lg:table-cell">
                            Impuesto
                          </TableHead>
                          <TableHead className="text-right h-10 px-4 hidden xl:table-cell">
                            Retención
                          </TableHead>
                          <TableHead className="text-right h-10 px-4 hidden md:table-cell">
                            IGTF
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody key={type}>
                        <AnimatePresence mode="popLayout">
                          {isLoading ? (
                            <motion.tr
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <TableCell
                                colSpan={10}
                                className="text-center py-12 text-muted-foreground italic h-48"
                              >
                                Cargando registros...
                              </TableCell>
                            </motion.tr>
                          ) : !data ||
                            !data.items ||
                            data.items.length === 0 ? (
                            <motion.tr
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <TableCell
                                colSpan={10}
                                className="text-center py-12 text-muted-foreground italic h-48"
                              >
                                No se encontraron registros para los criterios
                                seleccionados.
                              </TableCell>
                            </motion.tr>
                          ) : (
                            data.items.map((row: any, i: number) => (
                              <motion.tr
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: { delay: i * 0.02 },
                                }}
                                exit={{
                                  opacity: 0,
                                  transition: { duration: 0.2 },
                                }}
                                className={cn(
                                  "group border-b transition-colors hover:bg-muted/50 cursor-pointer",
                                  row.tipo_documento === "NC" &&
                                    "hover:bg-red-50/50 dark:hover:bg-red-900/10",
                                  row.tipo_documento === "INV" &&
                                    "hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                                )}
                                onClick={() => {
                                  if (row.tipo_documento === "NC") {
                                    setSelectedDocument({
                                      id: row.id,
                                      type: "NC",
                                    });
                                  } else if (row.tipo_documento === "INV") {
                                    setSelectedDocument({
                                      id: row.id,
                                      type: "INV",
                                    });
                                  }
                                }}
                              >
                                <TableCell className="py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">
                                  {row.nro_operacion}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-xs">
                                  {row.fecha &&
                                  !isNaN(new Date(row.fecha).getTime()) ? (
                                    <>
                                      {format(new Date(row.fecha), "dd/MM")}
                                      <span className="hidden md:inline">
                                        /{format(new Date(row.fecha), "yy")}
                                      </span>
                                    </>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-xs font-mono hidden lg:table-cell">
                                  {row.rif}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div className="flex flex-col">
                                    <span
                                      className="text-xs font-medium truncate max-w-[120px] md:max-w-[200px]"
                                      title={row.nombre_asociado}
                                    >
                                      {row.nombre_asociado}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground lg:hidden">
                                      {row.rif}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-mono font-bold text-primary">
                                        {row.numero_factura}
                                      </span>
                                      <Badge
                                        variant={
                                          row.tipo_documento === "INV"
                                            ? "outline"
                                            : "destructive"
                                        }
                                        className="text-[9px] h-4 px-1.5 uppercase leading-none font-bold"
                                      >
                                        {row.tipo_documento === "INV"
                                          ? "Fact"
                                          : "NC"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground text-[10px] hidden sm:inline">
                                        Ctrl: {row.numero_control}
                                      </span>
                                      {row.isCriterioCaja && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[8px] h-3 px-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-black"
                                        ></Badge>
                                      )}
                                      {row.tipo_documento === "NC" && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-xs">👆</span>{" "}
                                          Ver detalle
                                        </div>
                                      )}
                                      {row.tipo_documento === "INV" && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-xs">👆</span>{" "}
                                          Ver detalle
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-mono-data text-xs font-bold">
                                  {formatCurrency(
                                    row.total_ventas_incluyendo_iva ||
                                      row.total_compras_incluyendo_iva ||
                                      0,
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-mono-data text-xs text-muted-foreground hidden md:table-cell">
                                  {formatCurrency(row.base_imponible)}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-mono-data text-xs text-muted-foreground hidden lg:table-cell">
                                  {formatCurrency(row.impuesto)}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-mono-data text-xs text-red-600 dark:text-red-400 hidden xl:table-cell">
                                  {formatCurrency(row.iva_retenido || 0)}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-mono-data text-xs text-muted-foreground hidden md:table-cell">
                                  {formatCurrency(row.igtf_percibido || 0)}
                                </TableCell>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                  {data?.summary && (
                    <div className="space-y-4" key={`${type}-summary`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {type === "ventas" ? (
                          <>
                            <div className="p-4 rounded-xl border bg-muted/20">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                Total Ventas (IVA Incl.)
                              </p>
                              <p className="text-lg font-black font-mono-data">
                                {formatCurrency(
                                  data.summary.total_ventas_gravadas,
                                  "Bs",
                                )}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
                              <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1">
                                Débito Fiscal (IVA)
                              </p>
                              <p className="text-lg font-black font-mono-data text-blue-600 dark:text-blue-400">
                                {formatCurrency(
                                  data.summary.total_debito_fiscal,
                                  "Bs",
                                )}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border bg-orange-50/30 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900">
                              <p className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 mb-1">
                                IVA Retenido
                              </p>
                              <p className="text-lg font-black font-mono-data text-orange-600 dark:text-orange-400">
                                {formatCurrency(
                                  data.summary.total_iva_retenido,
                                  "Bs",
                                )}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border bg-green-50/30 dark:bg-green-950/10 border-green-100 dark:border-green-900">
                              <p className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 mb-1">
                                IGTF Percibido
                              </p>
                              <p className="text-lg font-black font-mono-data text-green-600 dark:text-green-400">
                                {formatCurrency(data.summary.total_igtf, "Bs")}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-4 rounded-xl border bg-muted/20">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                Total Compras (IVA Incl.)
                              </p>
                              <p className="text-lg font-black font-mono-data">
                                {formatCurrency(
                                  data.summary.total_compras_gravadas,
                                  "Bs",
                                )}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl border bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
                              <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1">
                                Crédito Fiscal (IVA)
                              </p>
                              <p className="text-lg font-black font-mono-data text-blue-600 dark:text-blue-400">
                                {formatCurrency(
                                  data.summary.total_credito_fiscal,
                                  "Bs",
                                )}
                              </p>
                            </div>
                            <div className="md:col-span-2 p-4 rounded-xl border bg-yellow-50/30 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-800">
                              <p className="text-[10px] uppercase font-bold text-yellow-800 dark:text-yellow-500 mb-1">
                                IVA Retenido a Terceros (A Pagar)
                              </p>
                              <p className="text-xl font-black font-mono-data text-yellow-700 dark:text-yellow-400">
                                {formatCurrency(
                                  data.summary.total_iva_retenido_terceros,
                                  "Bs",
                                )}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="p-4 rounded-xl border bg-muted/30 border-dashed">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Leyendas de Retenciones Fiscales
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {type === "ventas" ? (
                            <>
                              <p className="text-xs text-muted-foreground italic leading-relaxed">
                                * Se han recibido retenciones de IVA por un
                                monto de{" "}
                                <b className="font-mono-data text-orange-600">
                                  {formatCurrency(
                                    data.summary.total_iva_retenido,
                                    "Bs",
                                  )}
                                </b>{" "}
                                según lo reportado por los clientes en sus
                                comprobantes de retención.
                              </p>
                              <p className="text-xs text-muted-foreground italic leading-relaxed">
                                * El IGTF percibido acumulado de{" "}
                                <b className="font-mono-data text-green-600">
                                  {formatCurrency(
                                    data.summary.total_igtf,
                                    "Bs",
                                  )}
                                </b>{" "}
                                debe ser declarado y enterado quincenalmente
                                ante el SENIAT.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground italic leading-relaxed">
                                * Monto total de IVA retenido a proveedores:{" "}
                                <b className="font-mono-data text-yellow-700 dark:text-yellow-500">
                                  {formatCurrency(
                                    data.summary.total_iva_retenido_terceros,
                                    "Bs",
                                  )}
                                </b>
                                . Este monto representa una obligación de pago
                                inmediata al cierre del periodo.
                              </p>
                              <p className="text-xs text-muted-foreground italic leading-relaxed">
                                * Verifique que los números de comprobante
                                listados coincidan con el archivo TXT generado
                                para la declaración informativa de retenciones.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DocumentDetailModal
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
        documentId={selectedDocument?.id || null}
        type={selectedDocument?.type || null}
      />
    </>
  );
}
