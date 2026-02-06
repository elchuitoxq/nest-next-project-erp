"use client";

import { useExchangeRate } from "@/modules/settings/hooks/use-exchange-rate";
import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalRateDisplay() {
  const { data: rates, isLoading } = useExchangeRate();

  const vesRate = rates?.find(
    (r) => r.currency?.code === "VES" || r.currencyId === "VES", // Safer check if currency object is missing
  );

  // Fallback if we can't find explicitly by code, assuming the one that is NOT base (USD) is the one we want
  // or strictly looking for a known ID/Code pattern.
  // For now, let's rely on the backend returning 'currency' relation.

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Cargando tasa...</span>
      </div>
    );
  }

  if (!vesRate) {
    return null;
  }

  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between gap-2 rounded-md bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-emerald-600/80 tracking-wider">
              Tasa BCV
            </span>
            <span className="text-sm font-black text-emerald-900 leading-none">
              {Number(vesRate.rate).toLocaleString("es-VE", {
                minimumFractionDigits: 2,
              })}{" "}
              BS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
