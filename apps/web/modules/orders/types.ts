import {
  Partner,
  Warehouse,
  User,
  Branch,
  Currency,
  Product as ApiProduct,
} from "@/types/api";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: string | number;
  price: string | number;
  product?: ApiProduct;
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

  currency?: Currency;
  partner?: Partner;
  warehouse?: Warehouse;
  branch?: Branch;
  user?: User;
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
