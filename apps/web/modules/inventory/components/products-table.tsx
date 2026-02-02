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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Loader2 } from "lucide-react";
import { Product } from "../types";
import { DualCurrencyDisplay } from "./dual-currency-display";
import { motion, AnimatePresence } from "framer-motion";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductsTable({
  products,
  onEdit,
  isLoading,
}: ProductsTableProps) {
  return (
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
          <AnimatePresence mode="wait">
            {products.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.05 },
                }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group"
              >
                <TableCell className="font-mono-data text-xs font-bold leading-none py-3 px-4">
                  {product.sku}
                </TableCell>
                <TableCell className="py-3 px-4">{product.name}</TableCell>
                <TableCell className="py-3 px-4">
                  <DualCurrencyDisplay
                    value={Number(product.price)}
                    currencyId={product.currencyId}
                  />
                </TableCell>
                <TableCell className="py-3 px-4">
                  <DualCurrencyDisplay
                    value={Number(product.cost)}
                    currencyId={product.currencyId}
                  />
                </TableCell>
                <TableCell className="py-3 px-4">{product.minStock}</TableCell>
                <TableCell className="py-3 px-4">{product.stock}</TableCell>
                <TableCell className="text-right py-3 px-4">
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
              </motion.tr>
            ))}
            {!isLoading && products.length === 0 && (
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron productos.
                </TableCell>
              </motion.tr>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
