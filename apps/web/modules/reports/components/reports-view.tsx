"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fiscalReportsApi } from "../reports.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ReportsView() {
  const [type, setType] = useState<"ventas" | "compras" | "liquidacion">("ventas");
  const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
  const [year, setYear] = useState(new Date().getFullYear() + "");
  const [fortnight, setFortnight] = useState<string>("full"); // "full", "first", "second"

  const { data, isLoading } = useQuery({
    queryKey: ["fiscal-report", type, month, year, fortnight],
    queryFn: async () => {
      const fortnightParam = fortnight === "full" ? undefined : fortnight;
      if (type === "ventas") {
        return fiscalReportsApi.getLibroVentas(month, year, undefined, fortnightParam);
      } else if (type === "compras") {
        return fiscalReportsApi.getLibroCompras(month, year, undefined, fortnightParam);
      } else {
        return fiscalReportsApi.getFiscalSummary(month, year, undefined, fortnightParam);
      }
    },
  });

  const handleExport = async () => {
    if (type === "liquidacion") return; // No excel for summary yet
    if (!data || !data.items || data.items.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Libro ${type}`);

    // Define columns based on the data structure
    const columns = [
      { header: "#", key: "nro_operacion", width: 5 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "RIF", key: "rif", width: 15 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Factura", key: "numero_factura", width: 15 },
      { header: "Control", key: "numero_control", width: 15 },
      { header: "Total", key: "total", width: 15, style: { numFmt: '#,##0.00' } },
      { header: "Base", key: "base_imponible", width: 15, style: { numFmt: '#,##0.00' } },
      { header: "IVA", key: "impuesto", width: 15, style: { numFmt: '#,##0.00' } },
      { header: "IVA Retenido", key: "iva_retenido", width: 15, style: { numFmt: '#,##0.00' } },
      { header: "N° Comprobante", key: "numero_comprobante", width: 20 },
    ];

    if (type === "ventas") {
      columns.push({ header: "IGTF Percibido", key: "igtf_percibido", width: 15, style: { numFmt: '#,##0.00' } });
    }

    worksheet.columns = columns;

    // Add rows and format numbers
    data.items.forEach((row: any) => {
      const totalValue = row.total_ventas_incluyendo_iva || row.total_compras_incluyendo_iva;
      worksheet.addRow({
        nro_operacion: row.nro_operacion,
        fecha: new Date(row.fecha).toLocaleDateString(),
        rif: row.rif || '',
        nombre: row.nombre || '',
        numero_factura: row.numero_factura || '',
        numero_control: row.numero_control || '',
        total: Number(totalValue || 0),
        base_imponible: Number(row.base_imponible || 0),
        impuesto: Number(row.impuesto || 0),
        iva_retenido: Number(row.iva_retenido || 0),
        numero_comprobante: row.numero_comprobante || "",
        igtf_percibido: Number(row.igtf_percibido || 0),
      });
    });

    // Add Summary Rows
    worksheet.addRow([]);
    worksheet.addRow(["RESUMEN GENERAL"]);
    // Apply bold to summary header
    if (worksheet.lastRow) worksheet.lastRow.font = { bold: true };

    if (data.summary) {
      if (type === "ventas") {
        worksheet.addRow(["Total Ventas Gravadas", Number(data.summary.total_ventas_gravadas || 0)]);
        worksheet.addRow(["Total Base Imponible", Number(data.summary.total_base_imponible || 0)]);
        worksheet.addRow(["Total Débito Fiscal (IVA)", Number(data.summary.total_debito_fiscal || 0)]);
        worksheet.addRow(["Total IVA Retenido", Number(data.summary.total_iva_retenido || 0)]);
        worksheet.addRow(["Total IGTF", Number(data.summary.total_igtf || 0)]);
      } else {
        worksheet.addRow(["Total Compras Gravadas", Number(data.summary.total_compras_gravadas || 0)]);
        worksheet.addRow(["Total Base Imponible", Number(data.summary.total_base_imponible || 0)]);
        worksheet.addRow(["Total Crédito Fiscal (IVA)", Number(data.summary.total_credito_fiscal || 0)]);
        worksheet.addRow(["Total IVA Retenido a Terceros", Number(data.summary.total_iva_retenido_terceros || 0)]);
      }
    }

    // Style the header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Libro_${type}_${month}_${year}.xlsx`);
  };

  const handleDownloadTxt = async () => {
    try {
      const blob = await fiscalReportsApi.getRetencionesTxt(
        month,
        year,
        undefined,
        fortnight === "full" ? undefined : fortnight
      );
      saveAs(blob, `IVA_${year}${month}_${fortnight}.txt`);
    } catch (error) {
      console.error("Failed to download TXT", error);
      // Optional: Add toast notification here
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Libros Fiscales</h2>
          <p className="text-muted-foreground">
            Consulta y exportación de libros de compra y venta según normativa SENIAT.
          </p>
        </div>
        <div className="flex gap-2">
          {type === "compras" && (
            <Button variant="outline" onClick={handleDownloadTxt}>
              <Download className="mr-2 h-4 w-4" /> TXT Retenciones
            </Button>
          )}
          {type !== "liquidacion" && (
            <Button onClick={handleExport} disabled={!data || !data.items || data.items.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Exportar Excel
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <Tabs value={type} onValueChange={(v: any) => setType(v)} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="compras">Compras</TabsTrigger>
              <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 ml-auto">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    Mes {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fortnight} onValueChange={setFortnight}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Mes Completo</SelectItem>
                <SelectItem value="first">1era Quincena (1-15)</SelectItem>
                <SelectItem value="second">2da Quincena (16-Fin)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {type === "liquidacion" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
             <div className="col-span-3 flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : data ? (
            <>
              {/* Card 1: IVA Propio */}
              <Card className={data.iva_a_pagar > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Cuota Tributaria (IVA Propio)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${data.iva_a_pagar > 0 ? "text-red-600" : "text-green-600"}`}>
                    {data.iva_a_pagar > 0 ? formatCurrency(data.iva_a_pagar, "Bs") : "0,00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.excedente_credito > 0 
                      ? `Excedente a favor: ${formatCurrency(data.excedente_credito, "Bs")}`
                      : "Monto a pagar por operaciones propias"}
                  </p>
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Débitos Fiscales:</span>
                      <span>{formatCurrency(data.debitos_fiscales, "Bs")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(-) Créditos Fiscales:</span>
                      <span>{formatCurrency(data.creditos_fiscales, "Bs")}</span>
                    </div>
                    <div className="flex justify-between font-medium text-orange-600">
                      <span>(-) Retenciones Soportadas:</span>
                      <span>{formatCurrency(data.retenciones_soportadas, "Bs")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Retenciones a Enterar */}
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">
                    Retenciones IVA a Enterar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700">
                    {formatCurrency(data.retenciones_iva_a_enterar, "Bs")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dinero retenido a proveedores. 
                    <br />
                    <strong>Debe coincidir con el TXT.</strong>
                  </p>
                </CardContent>
              </Card>

              {/* Card 3: IGTF */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    IGTF Percibido (3%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.igtf_a_pagar, "Bs")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impuesto percibido por cobros en divisa.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa ({data?.items?.length || 0} Registros)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>RIF</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Control</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">IVA Ret.</TableHead>
                      <TableHead className="text-right">Comprobante</TableHead>
                      <TableHead className="text-right">IGTF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items?.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{row.nro_operacion}</TableCell>
                        <TableCell>
                          {new Date(row.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{row.rif}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={row.nombre}>
                          {row.nombre}
                        </TableCell>
                        <TableCell>{row.numero_factura}</TableCell>
                        <TableCell>{row.numero_control}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCurrency(
                            row.total_ventas_incluyendo_iva ||
                              row.total_compras_incluyendo_iva,
                            "Bs",
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCurrency(row.base_imponible, "Bs")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCurrency(row.impuesto, "Bs")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-red-600">
                           {Number(row.iva_retenido) > 0 ? formatCurrency(row.iva_retenido, "Bs") : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {row.numero_comprobante || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {Number(row.igtf_percibido) > 0 ? formatCurrency(row.igtf_percibido, "Bs") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data || !data.items || data.items.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={12}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No hay movimientos registrados en este período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* SUMMARY SECTION */}
              {data?.summary && (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
                   {type === 'ventas' ? (
                     <>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Total Ventas (Incl. IVA)</span>
                          <div className="text-lg font-bold">{formatCurrency(data.summary.total_ventas_gravadas, "Bs")}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Débito Fiscal (IVA)</span>
                          <div className="text-lg font-bold text-blue-600">{formatCurrency(data.summary.total_debito_fiscal, "Bs")}</div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-xs text-muted-foreground">IVA Retenido (Anticipo)</span>
                           <div className="text-lg font-bold text-orange-600">{formatCurrency(data.summary.total_iva_retenido, "Bs")}</div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-xs text-muted-foreground">IGTF Percibido</span>
                           <div className="text-lg font-bold text-green-600">{formatCurrency(data.summary.total_igtf, "Bs")}</div>
                        </div>
                     </>
                   ) : (
                      <>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Total Compras (Incl. IVA)</span>
                          <div className="text-lg font-bold">{formatCurrency(data.summary.total_compras_gravadas, "Bs")}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Crédito Fiscal (IVA)</span>
                          <div className="text-lg font-bold text-blue-600">{formatCurrency(data.summary.total_credito_fiscal, "Bs")}</div>
                        </div>
                        <div className="space-y-1 col-span-2 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                           <span className="text-xs text-yellow-800 dark:text-yellow-500 font-bold uppercase">Total Impuesto Retenido a Terceros (A Pagar)</span>
                           <div className="text-xl font-black text-yellow-900 dark:text-yellow-400 mt-1">{formatCurrency(data.summary.total_iva_retenido_terceros, "Bs")}</div>
                        </div>
                      </>
                   )}
                 </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
