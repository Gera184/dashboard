// Shapes of the data you enter. Saved in this browser (see local-store.ts).

export type EntryType = "income" | "expense";

export type Entry = {
  id: string;
  type: EntryType;
  date: string; // YYYY-MM-DD
  category: string; // income source or expense category
  amount: number; // ₪
  note?: string;
  person?: string; // for salaries: the employee's name
  createdAt: string;
};

export type Employee = {
  id: string;
  name: string;
  target: number; // monthly sales target, ₪ (0 = none)
  commissionRate: number; // percent, e.g. 6.25
  archived?: boolean; // left the business: hidden from forms, sales history kept
  createdAt: string;
};

export type Sale = {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
};

export type Loan = {
  id: string;
  lender: string;
  amount: number; // principal received
  monthlyPayment: number;
  firstPayment: string; // YYYY-MM-DD of the first repayment
  payments: number; // number of monthly repayments
  note?: string;
  createdAt: string;
};

export type Order = {
  id: string;
  client: string;
  date: string; // order date
  amount: number;
  paidDate?: string; // set when the client paid
  note?: string;
  createdAt: string;
};

export type Store = { version: 1; entries: Entry[]; employees: Employee[]; sales: Sale[]; loans: Loan[]; orders: Order[] };

export const EMPTY_STORE: Store = { version: 1, entries: [], employees: [], sales: [], loans: [], orders: [] };
