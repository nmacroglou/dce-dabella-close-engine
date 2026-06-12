import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { CommissionPayment } from "@/hooks/useCommissionLedger";

export type LedgerFormState = Partial<CommissionPayment>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: LedgerFormState;
  setForm: (f: LedgerFormState) => void;
  onSave: () => void;
  isPending: boolean;
}

/** Coerces a free-form numeric input into a number for state, allowing empty input. */
function parseMoney(v: string): number {
  if (!v.trim()) return 0;
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
/** Display value for a numeric input — empty string when 0 so the field can be cleared & typed cleanly. */
function moneyDisplay(n: number | null | undefined): string {
  if (n == null || n === 0) return "";
  return String(n);
}

export default function LedgerEntryDialog({ open, onOpenChange, form, setForm, onSave, isPending }: Props) {
  const expectedTotal = Number(form.expected_total ?? 0);
  const frontPaid = Number(form.front_paid_amount ?? 0);
  const backPaid = Number(form.back_paid_amount ?? 0);
  const outstanding = Math.max(0, expectedTotal - frontPaid - backPaid);
  const collectedPct = expectedTotal > 0 ? Math.round(((frontPaid + backPaid) / expectedTotal) * 100) : 0;
  const isPaid = outstanding <= 0.01 && expectedTotal > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-extrabold tracking-tight">
            {form.id ? "Edit entry" : "New ledger entry"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            All amounts save in real time when you hit Save.
          </DialogDescription>
        </DialogHeader>

        {/* Live summary tile */}
        <div
          className={`rounded-2xl border p-4 grid grid-cols-3 gap-3 ${
            isPaid ? "border-success/40 bg-success/[0.06]" : "border-hairline bg-muted/30"
          }`}
        >
          <SummaryCell label="Expected" value={formatCurrency(expectedTotal)} />
          <SummaryCell
            label="Collected"
            value={formatCurrency(frontPaid + backPaid)}
            sub={`${collectedPct}%`}
            tone={isPaid ? "success" : "default"}
          />
          <SummaryCell
            label="Outstanding"
            value={formatCurrency(outstanding)}
            tone={outstanding > 0 ? "warning" : "success"}
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale date">
              <Input
                type="date"
                value={form.sale_date ?? ""}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
              />
            </Field>
            <Field label="Job #">
              <Input
                value={form.job_number ?? ""}
                onChange={(e) => setForm({ ...form, job_number: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Customer">
            <Input
              value={form.customer_name ?? ""}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
          </Field>

          <FieldGroup title="Expected commission">
            <div className="grid grid-cols-3 gap-3">
              <MoneyField
                label="Total"
                value={form.expected_total}
                onChange={(v) => setForm({ ...form, expected_total: v })}
              />
              <MoneyField
                label="Front half"
                value={form.expected_front}
                onChange={(v) => setForm({ ...form, expected_front: v })}
              />
              <MoneyField
                label="Back half"
                value={form.expected_back}
                onChange={(v) => setForm({ ...form, expected_back: v })}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Payments received" tone="success">
            <div className="grid grid-cols-2 gap-3">
              <MoneyField
                label="Front paid amount"
                value={form.front_paid_amount}
                onChange={(v) => setForm({ ...form, front_paid_amount: v })}
              />
              <Field label="Front paid date">
                <Input
                  type="date"
                  value={form.front_paid_at ?? ""}
                  onChange={(e) => setForm({ ...form, front_paid_at: e.target.value || null })}
                />
              </Field>
              <MoneyField
                label="Back paid amount"
                value={form.back_paid_amount}
                onChange={(v) => setForm({ ...form, back_paid_amount: v })}
              />
              <Field label="Back paid date">
                <Input
                  type="date"
                  value={form.back_paid_at ?? ""}
                  onChange={(e) => setForm({ ...form, back_paid_at: e.target.value || null })}
                />
              </Field>
            </div>
          </FieldGroup>

          <Field label="Notes">
            <Textarea
              rows={2}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function FieldGroup({
  title, tone = "default", children,
}: {
  title: string;
  tone?: "default" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-3 space-y-3 ${
        tone === "success" ? "border-success/30 bg-success/[0.03]" : "border-hairline bg-background/40"
      }`}
    >
      <div
        className={`text-[10px] uppercase tracking-[0.12em] font-bold ${
          tone === "success" ? "text-success" : "text-muted-foreground"
        }`}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function MoneyField({
  label, value, onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold pointer-events-none">$</span>
        <Input
          type="text"
          inputMode="decimal"
          value={moneyDisplay(value)}
          placeholder="0.00"
          onChange={(e) => onChange(parseMoney(e.target.value))}
          className="pl-6 tabular-nums font-semibold"
        />
      </div>
    </Field>
  );
}

function SummaryCell({
  label, value, sub, tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning";
}) {
  const valueClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">{label}</div>
      <div className={`text-lg font-extrabold tabular-nums tracking-tight mt-0.5 ${valueClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
