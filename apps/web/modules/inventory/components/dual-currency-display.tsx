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
  // Fetch Rates (Cached)
  const { data: latestRates } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies/rates/latest");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Currencies (Cached)
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/finance/currencies");
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

  // If already in Base/Same currency, show simple price
  if (valueCurrency.id === baseCurrency.id) {
    return <span>{formatCurrency(value, valueCurrency.symbol)}</span>;
  }

  // If in Foreign Currency (e.g. USD), convert to Base (VES)
  const vesCurrency = currencies.find((c) => c.code === "VES");
  const vesRateObj = latestRates.find((r) => r.currencyId === vesCurrency?.id);
  const vesRate = vesRateObj ? Number(vesRateObj.rate) : null;

  if (valueCurrency.code === "USD" && vesCurrency && vesRate) {
    const converted = value * vesRate;
    return (
      <div className="flex flex-col">
        <span>{formatCurrency(value, valueCurrency.symbol)}</span>
        <span className="text-xs text-muted-foreground">
          ~ {formatCurrency(converted, vesCurrency.symbol)}
        </span>
      </div>
    );
  }

  // Fallback
  return <span>{formatCurrency(value, valueCurrency.symbol)}</span>;
}
