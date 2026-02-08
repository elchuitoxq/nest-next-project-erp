import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface RetentionsTableProps {
  type: "IVA" | "ISLR";
}

interface Retention {
  id: string;
  date: string;
  reference: string;
  amount: number;
  partnerName: string;
  partnerTaxId: string;
  relatedInvoice: string;
  metadata?: any;
}

interface ApiResponse {
  data: Retention[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export function RetentionsTable({ type }: RetentionsTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 25;

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["retentions", type, page, search],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse>(`/treasury/retentions`, {
        params: {
          type,
          page,
          limit,
          search,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
  const retentions = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, lastPage: 1 };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por código, proveedor..."
            value={search}
            onChange={handleSearch}
            className="pl-8 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="border rounded-md relative">
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
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead>Proveedor (Sujeto)</TableHead>
              <TableHead>Documento Afectado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto Retenido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {!isLoading && retentions?.length === 0 ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No hay retenciones registradas.
                  </TableCell>
                </motion.tr>
              ) : (
                retentions?.map((row: any, index: number) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      {row.date
                        ? format(new Date(row.date), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {(row.metadata as any)?.voucherDate ||
                        row.reference ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.partnerName || "Desconocido"}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.partnerTaxId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-primary">
                          {row.relatedInvoice || "-"}
                        </span>
                        {row.conceptName && (
                          <span className="text-[10px] text-muted-foreground uppercase leading-tight">
                            {row.conceptName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.invoiceType === "SALE" ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                          Venta
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                          Compra
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-black font-mono-data">
                      {formatCurrency(Number(row.amount))}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Página {meta.page} de {meta.lastPage}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => Math.min(old + 1, meta.lastPage))}
            disabled={page === meta.lastPage || isLoading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
