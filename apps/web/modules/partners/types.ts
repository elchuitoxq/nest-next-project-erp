export interface Partner {
  id: string;
  name: string;
  email: string | null;
  taxId: string;
  address: string | null;
  phone: string | null;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
  isSpecialTaxpayer: boolean;
  taxpayerType?: "ORDINARY" | "SPECIAL" | "FORMAL";
  retentionRate?: string | number;
  creditLimit: string | null;
  createdAt: string;
  updatedAt: string;
}
