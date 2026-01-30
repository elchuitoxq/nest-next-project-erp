"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useStock } from "../hooks/use-inventory";
import { Warehouse } from "../types";

interface WarehouseStockDialogProps {
  warehouse?: Warehouse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { Input } from "@/components/ui/input";
import { useState } from "react";

export function WarehouseStockDialog({
  warehouse,
  open,
  onOpenChange,
}: WarehouseStockDialogProps) {
  const [search, setSearch] = useState("");
  const { data: stock, isLoading } = useStock(warehouse?.id, search);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventario: {warehouse?.name}</DialogTitle>
          <DialogDescription>
            Existencias actuales en este almacén.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center py-4">
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* @ts-ignore */}
                {stock?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.sku}
                    </TableCell>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell className="text-right font-bold">
                      {Number(item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* @ts-ignore */}
                {!stock?.length && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground p-4"
                    >
                      No hay productos en este almacén.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
