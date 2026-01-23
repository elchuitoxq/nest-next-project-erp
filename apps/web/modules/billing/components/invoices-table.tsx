import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Eye, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Invoice } from "../types";
import { formatCurrency } from "@/lib/utils";

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewDetails: (invoice: Invoice) => void;
  type?: "SALE" | "PURCHASE";
}

const ALL_STATUSES = [
  { id: "DRAFT", label: "Borrador" },
  { id: "POSTED", label: "Publicado" },
  { id: "PARTIALLY_PAID", label: "Abonado" },
  { id: "PAID", label: "Pagado" },
  { id: "VOID", label: "Anulado" },
];

export function InvoicesTable({
  invoices,
  onViewDetails,
  type = "SALE",
}: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Borrador</Badge>;
      case "POSTED":
        return <Badge className="bg-blue-600">Publicado</Badge>;
      case "PARTIALLY_PAID":
        return <Badge className="bg-yellow-600">Abonado</Badge>;
      case "PAID":
        return <Badge className="bg-green-600">Pagado</Badge>;
      case "VOID":
        return <Badge variant="destructive">Anulado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId)
        ? prev.filter((id) => id !== statusId)
        : [...prev, statusId],
    );
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partner?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(inv.status);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o cliente..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Estado
              {selectedStatuses.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 rounded-sm"
                >
                  {selectedStatuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.id}
                checked={selectedStatuses.includes(status.id)}
                onCheckedChange={() => toggleStatus(status.id)}
              >
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedStatuses.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-center cursor-pointer"
                  onClick={() => setSelectedStatuses([])}
                >
                  Limpiar filtros
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>
                {type === "PURCHASE" ? "Proveedor" : "Cliente"}
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron facturas.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.code}</TableCell>
                  <TableCell>
                    {invoice.date
                      ? format(new Date(invoice.date), "dd/MM/yyyy", {
                          locale: es,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>{invoice.partner?.name || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewDetails(invoice)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
