export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  cost: number; // Front receives number, back sends numeric string -> axios transform or manual
  price: number;
  isExempt: boolean;
  taxRate: number;
  type: string;
  minStock: number;
  stock: number; // Calculated field
  currencyId?: string; // Added field
  createdAt: string;
}

export interface CreateProductValues {
  sku: string;
  name: string;
  price: number;
  cost?: number;
  taxRate?: number;
  minStock?: number;
  description?: string;
  isExempt?: boolean;
  currencyId?: string; // Added field
}

export interface UpdateProductValues extends Partial<CreateProductValues> {
  id: string;
}

export interface Warehouse {
  id: string;
  name: string;
  branchId?: string | null;
  branch?: {
    id: string;
    name: string;
  };
  address?: string;
  isActive: boolean;
}

export interface CreateWarehouseValues {
  name: string;
  address?: string;
  isActive?: boolean;
  branchId?: string;
}

export interface InventoryMoveLine {
  productId: string;
  quantity: number;
  cost?: number;
}

export interface CreateInventoryMoveValues {
  type: "IN" | "OUT" | "TRANSFER" | "ADJUST";
  fromWarehouseId?: string;
  toWarehouseId?: string;
  note?: string;
  lines: InventoryMoveLine[];
  userId?: string;
}

export interface Move {
  id: string;
  code: string;
  type: string;
  date: string;
  fromWarehouse?: { name: string };
  toWarehouse?: { name: string };
  user?: { name: string };
  note?: string;
  lines?: {
    id: string;
    quantity: number;
    product: { name: string };
  }[];
}
