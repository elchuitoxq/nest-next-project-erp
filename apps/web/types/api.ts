import { components } from "./api.schema";

export type ApiSchemas = components["schemas"];

// Core Domain Models
export type Currency = {
  id: string;
  code: string;
  symbol: string;
  name: string;
  isBase: boolean;
  isActive: boolean;
};

export type ExchangeRate = {
  id: string;
  currencyId: string;
  rate: number;
  date: string;
};

export type Warehouse = {
  id: string;
  name: string;
  branchId: string;
  isActive: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Branch = {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type Partner = {
  id: string;
  name: string;
  taxId: string;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  isSpecialTaxpayer?: boolean;
  taxpayerType?: "ORDINARY" | "SPECIAL" | "FORMAL";
  retentionRate?: string | number;
  creditLimit?: string | null;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
};

// DTOs
export type CreateOrderDto = ApiSchemas["CreateOrderDto"];
export type CreateOrderItemDto = ApiSchemas["CreateOrderItemDto"];
export type UpdateUserDto = ApiSchemas["UpdateUserDto"];
export type CreateUserDto = ApiSchemas["CreateUserDto"];

// Note: If some schemas are still Record<string, never>, we can define them manually here
// using the same structure as the backend until the Swagger plugin is fully pervasive.
