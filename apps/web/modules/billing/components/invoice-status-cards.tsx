"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoiceStats } from "../hooks/use-invoices";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Send, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface InvoiceStatusCardsProps {
  type: "SALE" | "PURCHASE";
}

const statusConfig = {
  DRAFT: {
    label: "Borradores",
    borderColor: "border-t-gray-500/50",
    iconColor: "text-gray-600",
    icon: FileText,
  },
  POSTED: {
    label: "Emitidas",
    borderColor: "border-t-blue-500/50",
    iconColor: "text-blue-600",
    icon: Send,
  },
  PAID: {
    label: "Pagadas",
    borderColor: "border-t-teal-500/50",
    iconColor: "text-teal-600",
    icon: CheckCircle2,
  },
  VOID: {
    label: "Anuladas",
    borderColor: "border-t-red-500/50",
    iconColor: "text-red-600",
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
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Object.entries(statusConfig).map(([status, config], index) => {
        const Icon = config.icon;
        const count = getCount(status);

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: index * 0.1 },
            }}
          >
            <Card
              className={`premium-shadow border-t-4 ${config.borderColor} transition-all duration-300 hover:bg-muted/50 cursor-default h-full`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {config.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono-data">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total en estado {config.label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
