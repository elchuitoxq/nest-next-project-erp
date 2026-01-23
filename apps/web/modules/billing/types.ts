import { Partner } from "@/modules/partners/types";

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: string | number;
  price: string | number;
  total: string | number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Invoice {
  id: string;
  code: string;
  partnerId: string;
  branchId: string;
  currencyId: string;
  status: string;
  totalBase: string | number;
  totalTax: string | number;
  totalIgtf: string | number;
  total: string | number;
  date: string;

  partner?: Partner;
  branch?: any;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  exchangeRate?: string | number;
  currency?: {
    id: string;
    code: string;
    symbol: string;
  };
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
