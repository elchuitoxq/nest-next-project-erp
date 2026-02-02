import { Text, View } from "@react-pdf/renderer";
import { DocumentLayout } from "./document-layout";
import { pdfStyles } from "./pdf-styles";
import { Order } from "@/modules/orders/types";
import { formatCurrency } from "@/lib/utils";

interface OrderPdfProps {
  order: Order;
  type: "SALE" | "PURCHASE";
}

export const OrderPdf = ({ order, type }: OrderPdfProps) => {
  const currencyCode = order.currency?.code || "VES";

  const formatMoney = (amount: number | string) =>
    formatCurrency(Number(amount), currencyCode);

  const title = type === "SALE" ? "PEDIDO DE VENTA" : "ORDEN DE COMPRA";

  const companyConfig = {
    name: order.branch?.name || "MI EMPRESA C.A.",
    address: order.branch?.address || "Dirección no registrada",
    taxId: order.branch?.taxId || "J-00000000-0",
    phone: order.branch?.phone || "",
  };

  return (
    <DocumentLayout companyConfig={companyConfig}>
      {/* Title */}
      <View style={pdfStyles.titleBlock}>
        <Text style={pdfStyles.title}>{title}</Text>
        <Text style={pdfStyles.subtitle}>#{order.code}</Text>
        <Text style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
          ESTADO: {order.status}
        </Text>
      </View>

      {/* Meta Info */}
      <View style={pdfStyles.metaGrid}>
        <View style={pdfStyles.metaColumn}>
          <Text style={pdfStyles.label}>
            {type === "SALE" ? "CLIENTE" : "PROVEEDOR"}
          </Text>
          <Text style={[pdfStyles.value, { fontWeight: "bold" }]}>
            {order.partner?.name || "N/A"}
          </Text>
          <Text style={pdfStyles.value}>
            RIF: {order.partner?.taxId || "N/A"}
          </Text>
          <Text style={pdfStyles.value}>
            {order.partner?.address || "Dirección no registrada"}
          </Text>
        </View>

        <View style={pdfStyles.metaColumn}>
          <Text style={pdfStyles.label}>FECHA</Text>
          <Text style={pdfStyles.value}>
            {new Date(order.date).toLocaleDateString()}
          </Text>

          <Text style={pdfStyles.label}>ALMACÉN (ORIGEN/DESTINO)</Text>
          <Text style={pdfStyles.value}>
            {order.warehouse?.name || "No especificado"}
          </Text>

          {order.exchangeRate && Number(order.exchangeRate) > 1 && (
            <Text style={pdfStyles.value}>
              Tasa: {Number(order.exchangeRate).toFixed(4)}
            </Text>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.colDesc, pdfStyles.label]}>PRODUCTO</Text>
          <Text style={[pdfStyles.colQty, pdfStyles.label]}>CANT.</Text>
          <Text style={[pdfStyles.colPrice, pdfStyles.label]}>
            PRECIO UNIT.
          </Text>
          <Text style={[pdfStyles.colTotal, pdfStyles.label]}>SUBTOTAL</Text>
        </View>

        {order.items.map((item, i) => {
          const subtotal = Number(item.quantity) * Number(item.price);
          return (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.colDesc, pdfStyles.colText]}>
                {item.product?.name || "Item"}
              </Text>
              <Text style={[pdfStyles.colQty, pdfStyles.colNum]}>
                {item.quantity}
              </Text>
              <Text style={[pdfStyles.colPrice, pdfStyles.colNum]}>
                {formatMoney(item.price)}
              </Text>
              <Text style={[pdfStyles.colTotal, pdfStyles.colNum]}>
                {formatMoney(subtotal)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View style={pdfStyles.totalsBlock}>
        <View style={pdfStyles.totalsTable}>
          <View style={pdfStyles.lastTotalRow}>
            <Text style={pdfStyles.totalValue}>TOTAL ESTIMADO</Text>
            <Text style={pdfStyles.totalValue}>{formatMoney(order.total)}</Text>
          </View>
          <Text
            style={{
              fontSize: 8,
              color: "#94a3b8",
              marginTop: 4,
              textAlign: "right",
            }}
          >
            * El impuesto se calcula en la facturación.
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: "#94a3b8",
              marginTop: 2,
              textAlign: "right",
            }}
          >
            * La tasa de cambio es referencial y está sujeta al valor del día al
            momento de la facturación.
          </Text>
        </View>
      </View>
    </DocumentLayout>
  );
};
