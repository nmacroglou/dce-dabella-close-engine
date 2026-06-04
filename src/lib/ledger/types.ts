import type { CommissionPayment } from "@/hooks/useCommissionLedger";

export type LedgerSortKey = "date" | "customer" | "status" | "amount";
export type LedgerStatusFilter = "all" | "pending" | "front" | "paid";

export type DecoratedRow = {
  row: CommissionPayment;
  paid: number;
  out: number;
  status: "paid" | "front" | "pending";
  searchHay: string;
  address: string;
  closedAmount: number;
  commissionPct: number;
};
