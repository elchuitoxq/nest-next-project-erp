"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDocumentFlow, DocumentNode } from "../hooks/use-document-flow";

export function DocumentFlow({ documentId }: { documentId: string }) {
  const { data, isLoading } = useDocumentFlow(documentId);

  if (isLoading)
    return <Loader2 className="h-8 w-8 animate-spin text-gray-400" />;

  if (!data || data.nodes.length === 0)
    return (
      <div className="text-sm text-gray-500">
        No hay documentos relacionados.
      </div>
    );

  // Simple Visualization: Group by Type or Topological Sort?
  // Let's do a Column Layout: Orders -> Invoices -> Payments

  const orders = data.nodes.filter((n) => n.type === "orders");
  const invoices = data.nodes.filter((n) => n.type === "invoices");
  const payments = data.nodes.filter((n) => n.type === "payments");

  const getColor = (type: string) => {
    switch (type) {
      case "orders":
        return "#3b82f6"; // blue
      case "invoices":
        return "#f59e0b"; // amber
      case "payments":
        return "#10b981"; // green
      default:
        return "#6b7280";
    }
  };

  const renderNode = (node: DocumentNode) => (
    <Card
      key={node.id}
      className="mb-4 w-full shadow-sm hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: getColor(node.type) }}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-sm">{node.label}</p>
            <p className="text-xs text-gray-500">
              {new Date(node.date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {node.subLabel}
          </Badge>
        </div>
        <div className="mt-2 text-right font-mono text-sm">
          {node.amount ? formatCurrency(node.amount) : "-"}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 bg-slate-50 rounded-lg border min-h-[300px]">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Column 1: Orders */}
        <div className="min-w-[250px] flex-1">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center bg-blue-100 p-2 rounded text-sm">
            Pedidos{" "}
            <span className="ml-auto bg-white px-2 rounded-full text-xs">
              {orders.length}
            </span>
          </h3>
          <div className="space-y-4">{orders.map(renderNode)}</div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center opacity-20">
          <ArrowRight size={32} />
        </div>

        {/* Column 2: Invoices */}
        <div className="min-w-[250px] flex-1">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center bg-amber-100 p-2 rounded text-sm">
            Facturas{" "}
            <span className="ml-auto bg-white px-2 rounded-full text-xs">
              {invoices.length}
            </span>
          </h3>
          <div className="space-y-4">{invoices.map(renderNode)}</div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center opacity-20">
          <ArrowRight size={32} />
        </div>

        {/* Column 3: Payments */}
        <div className="min-w-[250px] flex-1">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center bg-green-100 p-2 rounded text-sm">
            Pagos{" "}
            <span className="ml-auto bg-white px-2 rounded-full text-xs">
              {payments.length}
            </span>
          </h3>
          <div className="space-y-4">{payments.map(renderNode)}</div>
        </div>
      </div>
    </div>
  );
}
