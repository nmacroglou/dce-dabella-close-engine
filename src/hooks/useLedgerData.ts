import { useDeferredValue, useMemo, useState } from "react";
import { useCommissionLedger, type CommissionPayment } from "@/hooks/useCommissionLedger";
import { useDeals } from "@/hooks/useDeals";
import { useCommissionGrid } from "@/hooks/useCommissionGrid";
import { computeCommissionSheet } from "@/types/commission";
import type { DecoratedRow, LedgerSortKey, LedgerStatusFilter } from "@/lib/ledger/types";

/**
 * Centralizes Ledger derived data: decorated rows, totals, monthly buckets,
 * 12-month trend with momentum, plus filter + sort state.
 *
 * Keeping this in a hook lets `Ledger.tsx` stay a thin orchestrator and lets
 * subcomponents stay pure presentational.
 */
export function useLedgerData() {
  const { data: rows = [], isLoading } = useCommissionLedger();
  const { data: deals = [] } = useDeals();
  const { data: grid } = useCommissionGrid();

  const [statusFilter, setStatusFilter] = useState<LedgerStatusFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<{ key: LedgerSortKey; dir: "asc" | "desc" }>({
    key: "date",
    dir: "desc",
  });

  const dealMetaById = useMemo(() => {
    const map = new Map<string, { address: string; closedAmount: number; commissionPct: number }>();
    const tiers = grid?.tiers ?? [];
    const frontPct = grid?.front_end_pct ?? 50;
    for (const d of deals) {
      let commissionPct = 0;
      let closedAmount = Number(d.closed_amount ?? 0);
      try {
        if (d.commission_sheet) {
          const c = computeCommissionSheet(d.commission_sheet, tiers, frontPct);
          commissionPct = c.commissionPct;
          if (!closedAmount) closedAmount = c.contractTotal;
        }
      } catch { /* ignore */ }
      map.set(d.id, {
        address: d.address ?? "",
        closedAmount,
        commissionPct,
      });
    }
    return map;
  }, [deals, grid]);

  const { decorated, totals, monthly } = useMemo(() => {
    const nowMonth = new Date().toISOString().slice(0, 7);
    let expected = 0, frontExp = 0, backExp = 0, frontPaid = 0, backPaid = 0, paidThisMonth = 0;
    const m = new Map<string, { paid: number; expected: number; label: string }>();
    const decorated: DecoratedRow[] = rows.map((r) => {
      const eT = +r.expected_total || 0;
      const eF = +r.expected_front || 0;
      const eB = +r.expected_back || 0;
      const fP = +r.front_paid_amount || 0;
      const bP = +r.back_paid_amount || 0;
      expected += eT; frontExp += eF; backExp += eB; frontPaid += fP; backPaid += bP;
      if (r.front_paid_at && r.front_paid_at.startsWith(nowMonth)) paidThisMonth += fP;
      if (r.back_paid_at && r.back_paid_at.startsWith(nowMonth)) paidThisMonth += bP;
      const paid = fP + bP;
      const out = eT - paid;
      const status: "paid" | "front" | "pending" =
        out <= 0.01 ? "paid" : fP > 0 ? "front" : "pending";
      const d = r.sale_date || r.created_at?.slice(0, 10);
      if (d) {
        const key = d.slice(0, 7);
        let e = m.get(key);
        if (!e) {
          const [y, mo] = key.split("-");
          e = {
            paid: 0,
            expected: 0,
            label: new Date(+y, +mo - 1, 1).toLocaleDateString(undefined, {
              month: "short",
              year: "2-digit",
            }),
          };
          m.set(key, e);
        }
        e.expected += eT;
        e.paid += paid;
      }
      const meta = r.deal_id ? dealMetaById.get(r.deal_id) : undefined;
      const address = meta?.address ?? "";
      const closedAmount = meta?.closedAmount ?? 0;
      const commissionPct = meta?.commissionPct ?? 0;
      const searchHay = `${r.customer_name ?? ""} ${r.job_number ?? ""} ${address}`.toLowerCase();
      return { row: r, paid, out, status, searchHay, address, closedAmount, commissionPct };
    });
    const totalPaid = frontPaid + backPaid;
    const outstanding = Math.max(0, expected - totalPaid);
    const dealsCount = rows.length;
    return {
      decorated,
      totals: {
        expected, frontExp, backExp, frontPaid, backPaid, totalPaid, outstanding,
        paidThisMonth, dealsCount, avgDeal: dealsCount ? expected / dealsCount : 0,
      },
      monthly: [...m.entries()].sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [rows, dealMetaById]);

  const trend = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; expected: number; paid: number; rate: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const hit = monthly.find(([k]) => k === key);
      const expected = hit?.[1].expected ?? 0;
      const paid = hit?.[1].paid ?? 0;
      months.push({
        key,
        label: d.toLocaleDateString(undefined, { month: "short" }),
        expected,
        paid,
        rate: expected > 0 ? Math.min(100, (paid / expected) * 100) : 0,
      });
    }
    const last3 = months.slice(-3);
    const prev3 = months.slice(-6, -3);
    const sum = (arr: typeof months) => arr.reduce((s, m) => s + m.paid, 0);
    const last3Paid = sum(last3);
    const prev3Paid = sum(prev3);
    const momentum = prev3Paid > 0
      ? ((last3Paid - prev3Paid) / prev3Paid) * 100
      : last3Paid > 0 ? 100 : 0;
    const collected = months.reduce((s, m) => s + m.paid, 0);
    const billed = months.reduce((s, m) => s + m.expected, 0);
    const avgRate = billed > 0 ? (collected / billed) * 100 : 0;
    const best = months.reduce((b, m) => (m.paid > b.paid ? m : b), months[0]);
    return { months, momentum, avgRate, best, last3Paid, prev3Paid };
  }, [monthly]);

  const filteredRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const base = (statusFilter === "all" && !q)
      ? decorated
      : decorated.filter((d) => {
          if (statusFilter !== "all" && d.status !== statusFilter) return false;
          if (q && !d.searchHay.includes(q)) return false;
          return true;
        });
    const mult = sort.dir === "asc" ? 1 : -1;
    const statusRank = { pending: 0, front: 1, paid: 2 } as const;
    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "date": {
          const ad = a.row.sale_date ?? a.row.created_at ?? "";
          const bd = b.row.sale_date ?? b.row.created_at ?? "";
          cmp = ad < bd ? -1 : ad > bd ? 1 : 0;
          break;
        }
        case "customer":
          cmp = (a.row.customer_name ?? "").localeCompare(b.row.customer_name ?? "");
          break;
        case "status":
          cmp = statusRank[a.status] - statusRank[b.status];
          break;
        case "amount":
          cmp = (+a.row.expected_total || 0) - (+b.row.expected_total || 0);
          break;
      }
      return cmp * mult;
    });
    return sorted;
  }, [decorated, statusFilter, deferredSearch, sort]);

  function toggleSort(key: LedgerSortKey) {
    setSort((s) => s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "date" || key === "amount" ? "desc" : "asc" });
  }

  return {
    // raw
    rows,
    deals,
    grid,
    isLoading,
    // derived
    decorated,
    totals,
    trend,
    filteredRows,
    // filter/sort state
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    sort,
    toggleSort,
  };
}

export type LedgerData = ReturnType<typeof useLedgerData>;
export type { CommissionPayment };
