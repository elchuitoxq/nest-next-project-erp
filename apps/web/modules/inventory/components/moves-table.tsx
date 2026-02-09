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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Move } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
} from "lucide-react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MovesTableProps {
  data: Move[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSelectMove?: (move: Move) => void;
  isLoading?: boolean;

  // Filters
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string[];
  onTypeChange: (value: string[]) => void;
}

const ALL_TYPES = [
  { id: "IN", label: "Entrada" },
  { id: "OUT", label: "Salida" },
  { id: "TRANSFER", label: "Traslado" },
  { id: "ADJUST", label: "Ajuste" },
];

import { useDebounce } from "@/hooks/use-debounce";
import { useState, useEffect } from "react";

// ... existing imports

export function MovesTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onSelectMove,
  isLoading,
  search, // Initial/Parent search value
  onSearchChange,
  typeFilter,
  onTypeChange,
}: MovesTableProps) {
  // Internal state for immediate UI feedback
  const [internalSearch, setInternalSearch] = useState(search);
  const debouncedInternalSearch = useDebounce(internalSearch, 500);

  // Update parent when debounced value changes
  useEffect(() => {
    if (debouncedInternalSearch !== search) {
      onSearchChange(debouncedInternalSearch);
    }
  }, [debouncedInternalSearch, onSearchChange, search]);

  // Sync with parent if parent updates search externally
  useEffect(() => {
    if (search !== internalSearch && search !== debouncedInternalSearch) {
      setInternalSearch(search);
    }
  }, [search]);

  // ...
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "IN":
        return <Badge variant="success">ENTRADA</Badge>;
      case "OUT":
        return <Badge variant="destructive">SALIDA</Badge>;
      case "TRANSFER":
        return <Badge variant="secondary">TRASLADO</Badge>;
      case "ADJUST":
        return <Badge variant="outline">AJUSTE</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const columns = useMemo<ColumnDef<Move>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) =>
          row.original.date
            ? format(new Date(row.original.date), "dd/MM/yyyy HH:mm", {
                locale: es,
              })
            : "-",
      },
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
        cell: ({ row }) => getTypeBadge(row.original.type),
      },
      {
        accessorKey: "fromWarehouse.name",
        header: "Origen",
        cell: ({ row }) => row.original.fromWarehouse?.name || "-",
      },
      {
        accessorKey: "toWarehouse.name",
        header: "Destino",
        cell: ({ row }) => row.original.toWarehouse?.name || "-",
      },
      {
        accessorKey: "user.name",
        header: "Responsable",
        cell: ({ row }) => row.original.user?.name || "-",
      },
      {
        accessorKey: "note",
        header: "Nota",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">
            {row.original.note || ""}
          </div>
        ),
      },
    ],
    [],
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

  const toggleType = (id: string) => {
    if (typeFilter.includes(id)) {
      onTypeChange(typeFilter.filter((t) => t !== id));
    } else {
      onTypeChange([...typeFilter, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nota..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
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
                  onSelect={(e) => e.preventDefault()}
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
        </div>
      </div>

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
                  <TableHead key={header.id} className="h-10">
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
          <TableBody key={typeFilter.join(",")}>
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
                    onClick={() => onSelectMove?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
