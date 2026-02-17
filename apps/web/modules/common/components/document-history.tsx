"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuditHistory } from "../hooks/use-audit-history";
import { formatCurrency } from "@/lib/utils";
import {
  History,
  User,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCcw,
  CreditCard,
  Building2,
  Tag,
} from "lucide-react";
import { AuditLog } from "../types/audit";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DocumentHistoryProps {
  entityTable: string;
  entityId: string;
}

export function DocumentHistory({
  entityTable,
  entityId,
}: DocumentHistoryProps) {
  const { data: logs, isLoading } = useAuditHistory(entityTable, entityId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <History className="h-12 w-12 opacity-20 mb-4" />
        <p className="text-sm">
          No hay actividad registrada para este documento.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[450px] pr-4 overflow-y-auto custom-scrollbar">
      <div className="mt-2 space-y-6 ml-4 border-l border-zinc-200 dark:border-zinc-800 pb-8">
        {logs.map((log, index) => {
          // Extract amount if available in changes (direct or nested in payment)
          const amount = log.changes?.amount || log.changes?.payment?.amount;
          const currency =
            log.changes?.currency?.code ||
            log.changes?.payment?.currency?.code ||
            "VES";

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-8"
            >
              {/* Timeline Dot */}
              <div
                className={cn(
                  "absolute left-[-9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background shadow-sm",
                  getIconBgColor(log),
                )}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-pretty max-w-[70%]">
                    {getIcon(log)}
                    {log.description || getActionLabel(log)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono uppercase shrink-0">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>

                <div className="flex flex-col gap-2 bg-muted/30 p-2 rounded-md border border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {log.user?.name || "Sistema"}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {log.entityTable.toUpperCase()} / {log.action}
                      </span>
                    </div>
                  </div>

                  {/* Enriched details */}
                  {(log.documentCode || amount || log.changes?.metadata) && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {log.documentCode && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                            {log.documentCode}
                          </span>
                        )}
                        {amount && (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 ring-1 ring-inset ring-zinc-500/10">
                            {formatCurrency(amount, currency)}
                          </span>
                        )}

                        {/* Bank Account Name */}
                        {(log.changes?.bankAccount?.name ||
                          log.changes?.payment?.bankAccount?.name) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-700/10">
                            <Building2 className="h-3 w-3" />
                            {log.changes?.bankAccount?.name ||
                              log.changes?.payment?.bankAccount?.name}
                          </span>
                        )}

                        {/* Method Name */}
                        {(log.changes?.method?.name ||
                          log.changes?.payment?.method?.name) &&
                          !(
                            log.changes?.bankAccount?.name ||
                            log.changes?.payment?.bankAccount?.name
                          ) && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                              <Tag className="h-3 w-3" />
                              {log.changes?.method?.name ||
                                log.changes?.payment?.method?.name}
                            </span>
                          )}

                        {log.documentStatus && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset uppercase",
                              log.documentStatus === "PAID" ||
                                log.documentStatus === "COMPLETED" ||
                                log.documentStatus === "REGISTRADO" ||
                                log.documentStatus === "POSTED"
                                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-green-600/20"
                                : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-zinc-500/10",
                            )}
                          >
                            {log.documentStatus}
                          </span>
                        )}
                      </div>

                      {/* Payment Metadata (Retentions, etc) */}
                      {log.changes?.metadata &&
                        typeof log.changes.metadata === "object" && (
                          <div className="text-[10px] text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded border border-zinc-100 dark:border-zinc-800/50 flex flex-wrap gap-x-3 gap-y-1">
                            {Object.entries(
                              log.changes.metadata as Record<string, any>,
                            ).map(
                              ([key, value]) =>
                                value && (
                                  <span key={key} className="flex gap-1">
                                    <span className="font-semibold uppercase opacity-60">
                                      {key}:
                                    </span>
                                    <span>{String(value)}</span>
                                  </span>
                                ),
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getIcon(log: AuditLog) {
  const table = log.entityTable;
  const action = log.action;

  if (action === "CREATE") return <Plus className="h-4 w-4 shrink-0" />;
  if (action === "DELETE") return <XCircle className="h-4 w-4 shrink-0" />;

  if (table === "orders" && action === "UPDATE")
    return <CheckCircle2 className="h-4 w-4 shrink-0" />;
  if (table === "invoices" && action === "UPDATE")
    return <FileText className="h-4 w-4 shrink-0" />;
  if (table === "payments") return <CreditCard className="h-4 w-4 shrink-0" />;

  return <RefreshCcw className="h-4 w-4 shrink-0" />;
}

function getIconBgColor(log: AuditLog) {
  if (log.action === "DELETE") return "bg-destructive";

  const table = log.entityTable;
  if (table === "orders") return "bg-blue-500";
  if (table === "invoices") return "bg-amber-500";
  if (table === "payments") return "bg-emerald-500";

  return "bg-gray-500";
}

function getActionLabel(log: AuditLog) {
  const table = log.entityTable;
  const action = log.action;

  if (action === "CREATE") {
    switch (table) {
      case "orders":
        return "Pedido Creado";
      case "invoices":
        return "Factura Generada";
      case "payments":
        return "Pago Registrado";
      default:
        return `Registro en ${table} creado`;
    }
  }

  if (table === "orders" && action === "UPDATE")
    return "Estado de Pedido Actualizado";
  if (table === "invoices" && action === "UPDATE")
    return "Estado de Factura Actualizado";
  if (table === "payments" && action === "UPDATE")
    return "Pago Conciliado/Actualizado";

  return `${table} actualizado`;
}
