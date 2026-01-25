import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, FileJson, FileText, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface RetentionsTableProps {
  type: "IVA" | "ISLR";
}

export function RetentionsTable({ type }: RetentionsTableProps) {
  const [exporting, setExporting] = useState(false);
  const { data: retentions, isLoading } = useQuery({
    queryKey: ["retentions", type],
    queryFn: async () => {
      const { data } = await api.get(`/treasury/retentions?type=${type}`);
      return data;
    },
  });

  const handleDownload = async (id: string, ref: string) => {
    // ...
  };

  const handleDownloadXml = async (id: string, ref: string) => {
    // ...
  };

  const handleExportTxt = async () => {
    try {
      setExporting(true);
      const period = format(new Date(), "yyyyMM"); // Current period as default or let user choose
      const response = await api.get(`/treasury/retentions/export/txt?period=${period}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `retenciones_${period}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Error al exportar TXT");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {type === "IVA" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportTxt}
            disabled={exporting || retentions?.length === 0}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Exportar TXT SENIAT (Mes Actual)
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Comprobante</TableHead>
            <TableHead>Proveedor (Sujeto)</TableHead>
            <TableHead className="text-right">Monto Retenido</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {retentions?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center h-24 text-muted-foreground"
              >
                No hay retenciones registradas.
              </TableCell>
            </TableRow>
          ) : (
            retentions?.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.date ? format(new Date(row.date), "dd/MM/yyyy") : "-"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {(row.metadata as any)?.voucherDate || row.reference || "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{row.partnerName || "Desconocido"}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.partnerTaxId}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(Number(row.amount))}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(row.id, row.reference)}
                  >
                    <FileDown className="h-4 w-4 mr-2" /> PDF
                  </Button>
                  {type === "IVA" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadXml(row.id, row.reference)}
                    >
                      <FileJson className="h-4 w-4 mr-2" /> XML
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
