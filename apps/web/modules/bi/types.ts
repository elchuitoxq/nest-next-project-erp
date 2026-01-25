export interface KpiData {
  totalSales: number;
  totalPurchases: number;
  accountsReceivable: number;
  inventoryValue: number;
  pendingOrders: number;
  activeProducts: number;
}

export interface ChartData {
  date: string;
  income: number;
  expense: number;
}

export interface ActivityItem {
  id: string;
  type: string; // SALE, PURCHASE, PAYMENT, ADJUST, etc.
  entity: "INVOICE" | "PAYMENT" | "INVENTORY";
  code: string;
  date: string;
  total: string;
  currencyCode?: string;
  status: string;
}
