import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
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
import {
  MoreHorizontal,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Invoice } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InvoicesTableProps {
  data: Invoice[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onViewDetails: (invoice: Invoice) => void;
  isLoading?: boolean;

  // Filters
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusChange: (value: string[]) => void;
  typeFilter: string[];
  onTypeChange: (value: string[]) => void;
}

const ALL_STATUSES = [
  { id: "DRAFT", label: "Borrador" },
  { id: "POSTED", label: "Publicado" },
  { id: "PARTIALLY_PAID", label: "Abonado" },
  { id: "PAID", label: "Pagado" },
  { id: "VOID", label: "Anulado" },
];

const ALL_TYPES = [
  { id: "SALE", label: "Venta" },
  { id: "PURCHASE", label: "Compra" },
];

import { useDebounce } from "@/hooks/use-debounce";
import { useState, useEffect } from "react";

// ... existing imports

export function InvoicesTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onViewDetails,
  isLoading,
  search, // Initial/Parent search value
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
}: InvoicesTableProps) {
  // Internal state for immediate UI feedback
  const [internalSearch, setInternalSearch] = useState(search);
  const debouncedInternalSearch = useDebounce(internalSearch, 500);

  // Update parent when debounced value changes
  useEffect(() => {
    if (debouncedInternalSearch !== search) {
      onSearchChange(debouncedInternalSearch);
    }
  }, [debouncedInternalSearch, onSearchChange, search]);

  // Sync with parent if parent updates search externally (optional but good practice)
  useEffect(() => {
    if (search !== internalSearch && search !== debouncedInternalSearch) {
      setInternalSearch(search);
    }
  }, [search]);

  // ...
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Código",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => {
          const type = row.original.type;
          return type === "SALE" ? (
            <Badge className="bg-teal-600 hover:bg-teal-700">Venta</Badge>
          ) : (
            <Badge className="bg-orange-600 hover:bg-orange-700">Compra</Badge>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Fecha",
        meta: { className: "hidden sm:table-cell" },
        cell: ({ row }) =>
          row.original.date
            ? format(new Date(row.original.date), "dd/MM/yy", { locale: es })
            : "-",
      },
      {
        accessorKey: "partner.name",
        header: "Socio",
        cell: ({ row }) => row.original.partner?.name || "N/A",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          let variant: "default" | "secondary" | "destructive" | "outline" =
            "default";
          let className = "";

          switch (status) {
            case "DRAFT":
              variant = "secondary";
              break;
            case "POSTED":
              className = "bg-blue-600";
              break;
            case "PARTIALLY_PAID":
              className = "bg-yellow-600";
              break;
            case "PAID":
              className = "bg-green-600";
              break;
            case "VOID":
              variant = "destructive";
              break;
          }

          const label =
            ALL_STATUSES.find((s) => s.id === status)?.label || status;

          return (
            <Badge variant={variant} className={className}>
              {label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right font-bold font-mono-data">
            {formatCurrency(
              row.original.total,
              row.original.currency?.code || "USD",
            )}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onViewDetails],
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleStatus = (id: string) => {
    if (statusFilter.includes(id)) {
      onStatusChange(statusFilter.filter((s) => s !== id));
    } else {
      onStatusChange([...statusFilter, id]);
    }
  };

  const toggleType = (id: string) => {
    if (typeFilter.includes(id)) {
      onTypeChange(typeFilter.filter((t) => t !== id));
    } else {
      onTypeChange([...typeFilter, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar... (ej: A-001, Cliente X)"
            className="pl-8 w-full"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Tipo
                {typeFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 rounded-sm"
                  >
                    {typeFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_TYPES.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t.id}
                  checked={typeFilter.includes(t.id)}
                  onCheckedChange={() => toggleType(t.id)}
                  onSelect={(e) => e.preventDefault()} // Prevent closing
                >
                  {t.label}
                </DropdownMenuCheckboxItem>
              ))}
              {typeFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-center cursor-pointer"
                    onClick={() => onTypeChange([])}
                  >
                    Limpiar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Estado
                {statusFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 rounded-sm"
                  >
                    {statusFilter.length}
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
                  checked={statusFilter.includes(status.id)}
                  onCheckedChange={() => toggleStatus(status.id)}
                  onSelect={(e) => e.preventDefault()} // Prevent closing
                >
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-center cursor-pointer"
                    onClick={() => onStatusChange([])}
                  >
                    Limpiar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border relative">
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-10",
                      (header.column.columnDef.meta as { className?: string })
                        ?.className,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody key={`${typeFilter.join(",")}-${statusFilter.join(",")}`}>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group cursor-pointer"
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onViewDetails(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-3 px-4",
                          (cell.column.columnDef.meta as { className?: string })
                            ?.className,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading ? "" : "No se encontraron resultados."}
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
