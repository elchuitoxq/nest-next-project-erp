import { Partner } from "@/modules/partners/types";
import { Warehouse } from "@/modules/inventory/types";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: string | number;
  price: string | number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Order {
  id: string;
  code: string;
  partnerId: string;
  branchId: string;
  warehouseId?: string;
  status: string;
  total: string | number;
  exchangeRate?: string | number;
  date: string;
  userId?: string;

  partner?: Partner;
  warehouse?: Warehouse;
  branch?: any;
  user?: any;
  items: OrderItem[];
}

export interface CreateOrderValues {
  partnerId: string;
  branchId: string;
  warehouseId?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    productName?: string; // For UI display
    currencyId?: string;
  }[];
  type?: "SALE" | "PURCHASE";
  exchangeRate?: number;
}
