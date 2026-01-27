import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface DualCurrencyDisplayProps {
  value: number;
  currencyId?: string | null;
}

// Generic Component for Price/Cost conversion
export function DualCurrencyDisplay({
  value,
  currencyId,
}: DualCurrencyDisplayProps) {
  // Fetch Rates (Global)
  const { data: latestRates } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/currencies/rates/latest");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Currencies (Global)
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/currencies");
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (!currencyId || !latestRates || !currencies) {
    return <span>{formatCurrency(value)}</span>;
  }

  const valueCurrency = currencies.find((c) => c.id === currencyId);
  const baseCurrency =
    currencies.find((c) => c.isBase) ||
    currencies.find((c) => c.code === "VES"); // Layout fallback

  if (!valueCurrency || !baseCurrency) {
    return <span>{formatCurrency(value)}</span>;
  }

  // If value is ALREADY in VES, just show it
  if (valueCurrency.code === "VES") {
    return <span>{formatCurrency(value, valueCurrency.symbol)}</span>;
  }

  // If value is NOT VES (e.g. USD), try to convert to VES
  const vesCurrency = currencies.find((c) => c.code === "VES");
  
  // Find the rate for VES (How many VES per 1 Base Unit?)
  // In our seed, USD is Base. VES has a rate (e.g. 352.70).
  // So: 1 USD = 352.70 VES.
  // We need the rate where currencyId === VES.id
  const vesRateObj = latestRates.find((r) => r.currencyId === vesCurrency?.id);
  const vesRate = vesRateObj ? Number(vesRateObj.rate) : null;

  if (vesCurrency && vesRate) {
    // If product is in Base (USD) and we have VES rate:
    // Converted = Value(USD) * Rate(VES/USD)
    
    // Note: If product was in EUR, we'd need cross-rate logic, but for now we assume USD -> VES
    // or Base -> Target.
    
    const converted = value * vesRate;
    
    return (
      <div className="flex flex-col">
        <span>{formatCurrency(value, valueCurrency.symbol)}</span>
        <span className="text-xs text-muted-foreground font-medium">
          ~ {formatCurrency(converted, vesCurrency.symbol)}
        </span>
      </div>
    );
  }

  // Fallback
  return <span>{formatCurrency(value, valueCurrency.symbol)}</span>;
}
