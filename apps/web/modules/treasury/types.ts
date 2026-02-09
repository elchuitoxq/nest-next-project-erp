export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  currencyId: string;
  isDigital: boolean;
  allowedAccounts?: any[];
}

export interface Payment {
  id: string;
  invoiceId?: string;
  partnerId: string;
  methodId: string;
  currencyId: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  reference?: string;
  date: string;
  user?: { id: string; name: string };
  bankAccount?: { id: string; name: string };
  allocations?: { invoiceId: string; invoiceCode: string; amount: string }[];
}

export interface CreatePaymentDto {
  invoiceId?: string;
  partnerId: string;
  methodId: string;
  currencyId: string;
  amount: string;
  type?: "INCOME" | "EXPENSE";
  reference?: string;
  metadata?: any;
  allocations?: { invoiceId: string; amount: number }[];
  bankAccountId?: string;
  exchangeRate?: string;
}
