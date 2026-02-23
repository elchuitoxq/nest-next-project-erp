import {
  Partner,
  Currency,
  Branch,
  User,
  Product as ApiProduct,
} from "@/types/api";

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: string | number;
  price: string | number;
  total: string | number;
  product?: ApiProduct;
}

export interface Invoice {
  id: string;
  code: string;
  invoiceNumber?: string; // External number
  partnerId: string;
  branchId: string;
  currencyId: string;
  status: string;
  type: string; // "SALE" | "PURCHASE"
  totalBase: string | number;
  totalTax: string | number;
  totalIgtf: string | number;
  total: string | number;
  date: string;
  paidAmount?: string | number;

  partner?: Partner;
  branch?: Branch;
  user?: User;
  exchangeRate?: string | number;
  currency?: Currency;
  items: InvoiceItem[];
  payments?: {
    id: string;
    amount: string;
    date: string;
    methodId: string;
    reference?: string;
    method?: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  creditNotes?: {
    id: string;
    code: string;
    total: string | number;
    status: string;
  }[];
}
