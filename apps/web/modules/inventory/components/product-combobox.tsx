"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWarehouseStock } from "@/modules/inventory/hooks/use-stock";

interface ProductComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  onSelectObject?: (item: any) => void;
  mode?: "GLOBAL" | "STOCK";
  warehouseId?: string; // Required if mode === STOCK
  className?: string;
  disabled?: boolean;
}

export function ProductCombobox({
  value,
  onChange,
  mode = "GLOBAL",
  warehouseId,
  onSelectObject,
  className,
  disabled,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Determine which hook/query to use based on mode

  // 1. GLOBAL SEARCH (For Purchases)
  const { data: globalProducts, isLoading: isLoadingGlobal } = useQuery({
    queryKey: ["products-combobox", search],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/products", {
        params: { search },
      });
      return data;
    },
    enabled: mode === "GLOBAL",
  });

  // 2. STOCK SEARCH (For Orders)
  const { data: stockItems, isLoading: isLoadingStock } = useWarehouseStock(
    mode === "STOCK" ? warehouseId : undefined,
    search,
  );

  const isLoading = mode === "GLOBAL" ? isLoadingGlobal : isLoadingStock;

  // Normalize items to a common format
  const items =
    mode === "GLOBAL"
      ? (globalProducts || []).map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          detail: `SKU: ${p.sku}`,
          quantity: null, // No stock context in global
          price: p.price,
          cost: p.cost,
          currencyId: p.currencyId,
        }))
      : (stockItems || []).map((s) => ({
          id: s.product.id,
          name: s.product.name,
          sku: s.product.sku,
          detail: `Disp: ${parseFloat(s.quantity).toFixed(2)}`,
          quantity: parseFloat(s.quantity),
          price: s.product.price,
          cost: s.product.cost,
          currencyId: s.product.currencyId,
        }));

  // Find selected item label (We need to search in the loaded list OR fallback if not found)
  // If the list changes (search), the selected item might not be in it.
  // Ideally we should fetch the selected item details separately if not in list,
  // but for now let's rely on the user having selected it from a list previously or it being in current search.
  // Actually, if value is set but not in list, showing "ID" is ugly.
  // The 'value' prop is just the ID.
  // We can try to find it in the 'items' array.
  const selectedItem = items.find((i) => i.id === value);
  // Warning: If we search for "A", and selected "B" is hidden, label might be lost temporarily.
  // Ideally the parent should pass the 'label' or we fetch it.
  // For simplicity, we assume if it's selected, it should be visible or we show "Producto seleccionado"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || (mode === "STOCK" && !warehouseId)}
        >
          {selectedItem
            ? selectedItem.name
            : value
              ? "Producto seleccionado (Filtrado)" // Fallback text when filtered out
              : "Seleccionar..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={
              mode === "STOCK" ? "Buscar en stock..." : "Buscar productos..."
            }
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && items.length === 0 && (
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            )}

            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    if (onSelectObject) {
                      onSelectObject(item);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex justify-between text-xs text-muted-foreground w-full gap-2">
                      <span>{item.sku}</span>
                      {item.quantity !== null && (
                        <span
                          className={
                            item.quantity > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {item.detail}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
