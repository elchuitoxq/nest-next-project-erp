import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ActivityItem } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ActivityFeedProps {
  data?: ActivityItem[];
  isLoading: boolean;
}

export function ActivityFeed({ data, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-xl" />;
  }

  return (
    <Card className="col-span-3 premium-shadow">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas operaciones registradas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { delay: 0.2 + index * 0.1 },
              }}
              className="flex items-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted shadow-sm group-hover:bg-background transition-colors">
                {item.entity === "INVOICE" && <FileText className="h-4 w-4" />}
                {item.entity === "PAYMENT" && (
                  <CreditCard className="h-4 w-4" />
                )}
                {item.entity === "INVENTORY" && <Package className="h-4 w-4" />}
              </div>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getActivityTitle(item)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString("es-VE", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="ml-auto font-medium font-mono-data">
                {item.total && item.total !== "0" ? (
                  <div className="flex items-center gap-1">
                    {getAmountPrefix(item)}
                    {formatCurrency(Number(item.total), item.currencyCode)}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {item.code}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
          {!data?.length && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No hay actividad reciente.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getActivityTitle(item: ActivityItem) {
  if (item.entity === "INVOICE") {
    return item.type === "SALE"
      ? `Venta Registrada (${item.code})`
      : `Compra Registrada (${item.code})`;
  }
  if (item.entity === "PAYMENT") {
    return item.status === "INCOME"
      ? `Pago Recibido (${item.code})`
      : `Pago Emitido (${item.code})`;
  }
  if (item.entity === "INVENTORY") {
    return `Movimiento Inventario (${item.code})`;
  }
  return "Operación Desconocida";
}

function getAmountPrefix(item: ActivityItem) {
  const isPositive =
    (item.entity === "INVOICE" && item.type === "SALE") ||
    (item.entity === "PAYMENT" && item.status === "INCOME");

  return isPositive ? (
    <span className="text-teal-600 font-bold">+</span>
  ) : (
    <span className="text-orange-600 font-bold">-</span>
  );
}
