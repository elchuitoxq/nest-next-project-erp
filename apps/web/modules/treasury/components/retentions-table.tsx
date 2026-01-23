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
import { FileDown, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface RetentionsTableProps {
  type: "IVA" | "ISLR";
}

export function RetentionsTable({ type }: RetentionsTableProps) {
  const { data: retentions, isLoading } = useQuery({
    queryKey: ["retentions", type],
    queryFn: async () => {
      const { data } = await api.get(`/treasury/retentions?type=${type}`);
      return data;
    },
  });

  const handleDownload = async (id: string, ref: string) => {
    try {
      const response = await api.get(`/treasury/retentions/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `comprobante-${ref || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Error al descargar comprobante");
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
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(row.id, row.reference)}
                  >
                    <FileDown className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
