"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoiceStats } from "../hooks/use-invoices";
import { FileText, Send, CheckCircle2, XCircle } from "lucide-react";

interface InvoiceStatusCardsProps {
  type: "SALE" | "PURCHASE";
}

const statusConfig = {
  DRAFT: {
    label: "Borradores",
    color: "bg-gray-100 text-gray-700",
    icon: FileText,
  },
  POSTED: {
    label: "Emitidas",
    color: "bg-blue-100 text-blue-700",
    icon: Send,
  },
  PAID: {
    label: "Pagadas",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  VOID: {
    label: "Anuladas",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export function InvoiceStatusCards({ type }: InvoiceStatusCardsProps) {
  const { data: stats, isLoading } = useInvoiceStats(type);

  const getCount = (status: string) => {
    return stats?.find((s) => s.status === status)?.count || 0;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Object.entries(statusConfig).map(([status, config]) => {
        const Icon = config.icon;
        const count = getCount(status);

        return (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {config.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">
                Total en estado {config.label.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
