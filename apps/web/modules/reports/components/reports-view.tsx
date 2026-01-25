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
import { Loader2, Download } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export function ReportsView() {
  const [type, setType] = useState<"ventas" | "compras">("ventas");
  const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
  const [year, setYear] = useState(new Date().getFullYear() + "");

  const { data, isLoading } = useQuery({
    queryKey: ["fiscal-report", type, month, year],
    queryFn: async () => {
      if (type === "ventas") {
        return fiscalReportsApi.getLibroVentas(month, year);
      } else {
        return fiscalReportsApi.getLibroCompras(month, year);
      }
    },
  });

  const handleExport = async () => {
    if (!data || data.length === 0) return;

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
      { header: "Total", key: "total", width: 15 },
      { header: "Base", key: "base_imponible", width: 15 },
      { header: "IVA", key: "impuesto", width: 15 },
      { header: "IVA Retenido", key: "iva_retenido", width: 15 },
    ];

    if (type === "ventas") {
      columns.push({ header: "IGTF Percibido", key: "igtf_percibido", width: 15 });
    }

    worksheet.columns = columns;

    // Add rows and format numbers
    data.forEach((row: any) => {
      const totalValue = row.total_ventas_incluyendo_iva || row.total_compras_incluyendo_iva;
      worksheet.addRow({
        ...row,
        fecha: new Date(row.fecha).toLocaleDateString(),
        total: Number(totalValue).toFixed(2),
        base_imponible: Number(row.base_imponible).toFixed(2),
        impuesto: Number(row.impuesto).toFixed(2),
        iva_retenido: Number(row.iva_retenido || 0).toFixed(2),
        igtf_percibido: Number(row.igtf_percibido || 0).toFixed(2),
      });
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Libro_${type}_${month}_${year}.xlsx`);
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
        <Button onClick={handleExport} disabled={!data || data.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Libro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ventas">Libro de Ventas</SelectItem>
              <SelectItem value="compras">Libro de Compras</SelectItem>
            </SelectContent>
          </Select>

          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa ({data?.length || 0} Registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">RIF</th>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Factura</th>
                    <th className="px-4 py-2">Control</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right">Base</th>
                    <th className="px-4 py-2 text-right">IVA</th>
                    <th className="px-4 py-2 text-right">IGTF</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((row: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2">{row.nro_operacion}</td>
                      <td className="px-4 py-2">
                        {new Date(row.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{row.rif}</td>
                      <td className="px-4 py-2">{row.nombre}</td>
                      <td className="px-4 py-2">{row.numero_factura}</td>
                      <td className="px-4 py-2">{row.numero_control}</td>
                      <td className="px-4 py-2 text-right">
                        {Number(
                          row.total_ventas_incluyendo_iva ||
                            row.total_compras_incluyendo_iva,
                        ).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(row.base_imponible).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(row.impuesto).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(row.igtf_percibido || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
