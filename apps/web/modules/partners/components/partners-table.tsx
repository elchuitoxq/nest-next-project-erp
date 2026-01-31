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
  Pencil,
  Trash,
  FileText,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Partner } from "../types";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface PartnersTableProps {
  data: Partner[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  onViewStatement?: (partner: Partner) => void;
  isLoading?: boolean;

  // Filters
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string[];
  onTypeChange: (value: string[]) => void;
}

const ALL_TYPES = [
  { id: "CUSTOMER", label: "Cliente" },
  { id: "SUPPLIER", label: "Proveedor" },
];

export function PartnersTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onViewStatement,
  isLoading,
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
}: PartnersTableProps) {
  const columns = useMemo<ColumnDef<Partner>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "taxId",
        header: "RIF/CI",
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge
              variant={type === "CUSTOMER" ? "default" : "secondary"}
            >
              {type === "CUSTOMER"
                ? "Cliente"
                : type === "SUPPLIER"
                  ? "Proveedor"
                  : "Ambos"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => row.original.phone || "-",
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
                <DropdownMenuItem
                  onClick={() => onViewStatement?.(row.original)}
                >
                  <FileText className="mr-2 h-4 w-4" /> Estado de Cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(row.original)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onViewStatement],
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
            placeholder="Buscar por nombre, RIF o email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
