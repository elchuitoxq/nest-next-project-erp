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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil } from "lucide-react";
import { Product } from "../types";
import { formatCurrency } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DualCurrencyDisplay } from "./dual-currency-display";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

// ... imports will be updated via separate mechanism if I can't do it in one go or if I just remove the function.
// Actually, I should remove the function and add the import.
// Since `replace_file_content` is a single block, I'll remove the function definition.
// I will need another call to add the import. Using `replace_file_content` for the whole file structure is risky if I don't see all lines.
// But I can replace the function definition with nothing (or the import if I target top).
// Let's first remove the function definition.

export function ProductsTable({ products, onEdit }: ProductsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Stock Mín</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <DualCurrencyDisplay
                  value={Number(product.price)}
                  currencyId={product.currencyId}
                />
              </TableCell>
              <TableCell>
                <DualCurrencyDisplay
                  value={Number(product.cost)}
                  currencyId={product.currencyId}
                />
              </TableCell>
              <TableCell>{product.minStock}</TableCell>
              <TableCell>{product.stock}</TableCell>
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
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
