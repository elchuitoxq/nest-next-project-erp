"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function ExchangeRateWidget() {
  const queryClient = useQueryClient();

  // Fetch Currencies to map IDs
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/settings/currencies");
      return data;
    },
  });

  const { data: latestRates, isLoading } = useQuery({
    queryKey: ["exchange-rates", "latest"],
    queryFn: async () => {
      const { data } = await api.get("/settings/currencies/rates/latest");
      return data;
    },
  });

  const [rate, setRate] = useState("");

  const { mutate: updateRate, isPending } = useMutation({
    mutationFn: async (val: string) => {
      const ves = currencies?.find((c: any) => c.code === "VES");
      if (!ves) throw new Error("Moneda VES no encontrada");

      await api.post("/settings/currencies/rates", {
        currencyId: ves.id,
        rate: val,
        source: "MANUAL_WIDGET",
      });
    },
    onSuccess: () => {
      toast.success("Tasa actualizada");
      queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
      setRate("");
    },
    onError: () => toast.error("Error al actualizar tasa"),
  });

  const getVesRate = () => {
    if (!currencies || !latestRates) return null;
    const ves = currencies.find((c: any) => c.code === "VES");
    if (!ves) return null;
    const rateObj = latestRates.find((r: any) => r.currencyId === ves.id);
    return rateObj ? rateObj.rate : null;
  };

  const currentRate = getVesRate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tasa de Cambio (BCV/Paralelo)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {isLoading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <span>
              {currentRate
                ? `Bs. ${Number(currentRate).toFixed(2)}`
                : "Sin Tasa"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nueva Tasa (Bs/USD)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            type="number"
          />
          <Button
            onClick={() => updateRate(rate)}
            disabled={!rate || isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isPending ? "..." : "Actualizar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Define cuánto vale 1 USD en Bolívares para cálculos automáticos.
        </p>
      </CardContent>
    </Card>
  );
}
