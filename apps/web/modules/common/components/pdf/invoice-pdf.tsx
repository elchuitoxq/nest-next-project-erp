import { Text, View } from "@react-pdf/renderer";
import { DocumentLayout } from "./document-layout";
import { pdfStyles } from "./pdf-styles";
import { Invoice } from "@/modules/billing/types";
import { formatCurrency } from "@/lib/utils";

interface InvoicePdfProps {
  invoice: Invoice;
}

export const InvoicePdf = ({ invoice }: InvoicePdfProps) => {
  const currencyCode = invoice.currency?.code || "VES";

  // Safe formatting helpers for strict PDF text usage
  const formatMoney = (amount: number | string) =>
    formatCurrency(Number(amount), currencyCode);

  const companyConfig = {
    name: invoice.branch?.name || "MI EMPRESA C.A.",
    address: invoice.branch?.address || "Dirección no registrada",
    taxId: invoice.branch?.taxId || "J-00000000-0",
    phone: invoice.branch?.phone || "",
  };

  return (
    <DocumentLayout companyConfig={companyConfig}>
      {/* Title */}
      <View style={pdfStyles.titleBlock}>
        <Text style={pdfStyles.title}>
          {invoice.type === "SALE" ? "FACTURA DE VENTA" : "FACTURA DE COMPRA"}
        </Text>
        <Text style={pdfStyles.subtitle}>
          #{invoice.invoiceNumber || invoice.code}
        </Text>
        {invoice.status === "DRAFT" && (
          <Text style={{ color: "red", fontSize: 10 }}>(BORRADOR)</Text>
        )}
      </View>

      {/* Meta Info Grid */}
      <View style={pdfStyles.metaGrid}>
        {/* Left: Customer/Partner */}
        <View style={pdfStyles.metaColumn}>
          <Text style={pdfStyles.label}>
            {invoice.type === "SALE" ? "CLIENTE" : "PROVEEDOR"}
          </Text>
          <Text style={[pdfStyles.value, { fontWeight: "bold" }]}>
            {invoice.partner?.name || "N/A"}
          </Text>
          <Text style={pdfStyles.value}>
            RIF: {invoice.partner?.taxId || "N/A"}
          </Text>
          <Text style={pdfStyles.value}>
            {invoice.partner?.address || "Dirección no registrada"}
          </Text>
        </View>

        {/* Right: Invoice Details */}
        <View style={pdfStyles.metaColumn}>
          <Text style={pdfStyles.label}>FECHA DE EMISIÓN</Text>
          <Text style={pdfStyles.value}>
            {new Date(invoice.date).toLocaleDateString()}
          </Text>

          <Text style={pdfStyles.label}>MONEDA</Text>
          <Text style={pdfStyles.value}>
            {currencyCode} - {invoice.currency?.symbol}
          </Text>

          {invoice.exchangeRate && Number(invoice.exchangeRate) > 1 && (
            <>
              <Text style={pdfStyles.label}>TASA DE CAMBIO</Text>
              <Text style={pdfStyles.value}>
                {Number(invoice.exchangeRate).toFixed(4)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.colDesc, pdfStyles.label]}>DESCRIPCIÓN</Text>
          <Text style={[pdfStyles.colQty, pdfStyles.label]}>CANT.</Text>
          <Text style={[pdfStyles.colPrice, pdfStyles.label]}>PRECIO</Text>
          <Text style={[pdfStyles.colTotal, pdfStyles.label]}>TOTAL</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.colDesc, pdfStyles.colText]}>
              {item.product?.name || "Producto desconocido"}
            </Text>
            <Text style={[pdfStyles.colQty, pdfStyles.colNum]}>
              {item.quantity}
            </Text>
            <Text style={[pdfStyles.colPrice, pdfStyles.colNum]}>
              {formatMoney(item.price)}
            </Text>
            <Text style={[pdfStyles.colTotal, pdfStyles.colNum]}>
              {formatMoney(item.total)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={pdfStyles.totalsBlock}>
        <View style={pdfStyles.totalsTable}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>BASE IMPONIBLE</Text>
            <Text style={pdfStyles.colNum}>
              {formatMoney(invoice.totalBase)}
            </Text>
          </View>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>IVA (16%)</Text>
            <Text style={pdfStyles.colNum}>
              {formatMoney(invoice.totalTax)}
            </Text>
          </View>
          {Number(invoice.totalIgtf) > 0 && (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalLabel}>IGTF (3%)</Text>
              <Text style={pdfStyles.colNum}>
                {formatMoney(invoice.totalIgtf)}
              </Text>
            </View>
          )}
          <View style={pdfStyles.lastTotalRow}>
            <Text style={pdfStyles.totalValue}>TOTAL</Text>
            <Text style={pdfStyles.totalValue}>
              {formatMoney(invoice.total)}
            </Text>
          </View>
        </View>
      </View>
    </DocumentLayout>
  );
};
