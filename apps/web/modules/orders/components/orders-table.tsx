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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "../types";
import {
  MoreHorizontal,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

interface OrdersTableProps {
  data: Order[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onViewDetails?: (order: Order) => void;
  isLoading?: boolean;

  // Filters
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusChange: (value: string[]) => void;
}

const ALL_STATUSES = [
  { id: "PENDING", label: "Pendiente" },
  { id: "CONFIRMED", label: "Confirmado" },
  { id: "COMPLETED", label: "Completado" },
  { id: "CANCELLED", label: "Cancelado" },
];

export function OrdersTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onViewDetails,
  isLoading,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: OrdersTableProps) {
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) =>
          row.original.date
            ? format(new Date(row.original.date), "dd/MM/yyyy", { locale: es })
            : "-",
      },
      {
        accessorKey: "code",
        header: "Código",
        cell: ({ row }) => (
          <span className="font-medium font-mono text-xs">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "partner.name",
        header: "Cliente / Proveedor",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.partner?.name || "Desconocido"}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.partner?.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "branch.name",
        header: "Sucursal",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.branch?.name || "-"}</span>
        ),
      },
      {
        accessorKey: "warehouse.name",
        header: "Almacén",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.warehouse?.name || "-"}</span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(
              parseFloat(row.original.total.toString()).toFixed(2),
              row.original.currency?.code,
            )}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          switch (status) {
            case "PENDING":
              return <Badge variant="secondary">Pendiente</Badge>;
            case "CONFIRMED":
              return (
                <Badge className="bg-blue-600 hover:bg-blue-700">
                  Confirmado
                </Badge>
              );
            case "COMPLETED":
              return (
                <Badge className="bg-green-600 hover:bg-green-700">
                  Completado
                </Badge>
              );
            case "CANCELLED":
              return <Badge variant="destructive">Cancelado</Badge>;
            default:
              return <Badge>{status}</Badge>;
          }
        },
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
                <DropdownMenuItem onClick={() => onViewDetails?.(row.original)}>
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o cliente..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
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
                  onSelect={(e) => e.preventDefault()}
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

      <div className="rounded-md border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
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
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {isLoading ? "Cargando..." : "No se encontraron resultados."}
                </TableCell>
              </TableRow>
            )}
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
