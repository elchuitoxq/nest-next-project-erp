import { Currency, User, Branch } from "@/types/api";

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  currencyId: string;
  isDigital: boolean;
  allowedAccounts?: {
    id: string;
    bankAccountId: string;
  }[];
}

export interface Payment {
  id: string;
  invoiceId?: string;
  partnerId: string;
  methodId: string;
  methodName?: string;
  currencyId: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  status: "POSTED" | "VOID";
  reference?: string;
  date: string;
  user?: User;
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
  metadata?: unknown;
  allocations?: { invoiceId: string; amount: number }[];
  bankAccountId?: string;
  exchangeRate?: string;
}
