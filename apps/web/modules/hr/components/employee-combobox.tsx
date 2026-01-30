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
import { useEmployees } from "../hooks/use-employees";

interface EmployeeComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EmployeeCombobox({
  value,
  onChange,
  className,
  disabled,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const { data: employees, isLoading } = useEmployees("ACTIVE");

  const items = (employees || []).map((emp) => ({
    id: emp.id,
    label: `${emp.firstName} ${emp.lastName}`,
    detail: emp.identityCard,
  }));

  const selectedItem = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || isLoading}
        >
          {selectedItem ? selectedItem.label : "Seleccionar empleado..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empleado..." />
          <CommandList>
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && items.length === 0 && (
              <CommandEmpty>No se encontraron empleados.</CommandEmpty>
            )}

            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.detail}`} // Searchable string
                  onSelect={() => {
                    onChange(item.id === value ? "" : item.id);
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
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      CI: {item.detail}
                    </span>
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
