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
import { usePartners } from "../hooks/use-partners";

interface PartnerComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  type?: "CUSTOMER" | "SUPPLIER";
  className?: string;
  disabled?: boolean;
}

export function PartnerCombobox({
  value,
  onChange,
  type,
  className,
  disabled,
}: PartnerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch with search and type filters
  const { data: partnersResponse, isLoading } = usePartners({ search, type });
  const partners = partnersResponse?.data || [];

  const selectedPartner = partners?.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedPartner ? selectedPartner.name : "Seleccionar..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre o RIF..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && partners?.length === 0 && (
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            )}

            <CommandGroup>
              {partners?.map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={partner.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === partner.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{partner.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {partner.taxId}
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
