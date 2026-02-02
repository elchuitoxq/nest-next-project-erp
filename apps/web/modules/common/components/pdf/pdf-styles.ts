/* eslint-disable @typescript-eslint/no-unused-vars */
import { StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts if needed. For now, we use standard Helvetica.
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf',
// });

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 10,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a", // Slate 900
    textTransform: "uppercase",
  },
  companyDetails: {
    fontSize: 9,
    textAlign: "right",
    color: "#64748b", // Slate 500
  },
  titleBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metaColumn: {
    width: "48%",
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#94a3b8", // Slate 400
    marginBottom: 2,
    fontWeight: "bold",
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc", // Slate 50
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0", // Slate 200
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9", // Slate 100
    padding: 6,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },

  colText: { fontSize: 9 },
  colNum: { fontSize: 9, fontFamily: "Helvetica-Bold" }, // Use bold variant for numbers to mimic monospaced feel

  totalsBlock: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsTable: {
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lastTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#0f172a",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});
