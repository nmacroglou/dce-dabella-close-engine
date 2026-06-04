import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function LedgerEntryDialog({ open, onOpenChange, form, setForm, onSave, isPending }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit entry" : "New ledger entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale date">
              <Input type="date" value={form.sale_date ?? ""} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
            </Field>
            <Field label="Job #">
              <Input value={form.job_number ?? ""} onChange={(e) => setForm({ ...form, job_number: e.target.value })} />
            </Field>
          </div>
          <Field label="Customer">
            <Input value={form.customer_name ?? ""} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Expected total">
              <Input type="number" value={form.expected_total ?? 0} onChange={(e) => setForm({ ...form, expected_total: Number(e.target.value) })} />
            </Field>
            <Field label="Expected front">
              <Input type="number" value={form.expected_front ?? 0} onChange={(e) => setForm({ ...form, expected_front: Number(e.target.value) })} />
            </Field>
            <Field label="Expected back">
              <Input type="number" value={form.expected_back ?? 0} onChange={(e) => setForm({ ...form, expected_back: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Front paid amount">
              <Input type="number" value={form.front_paid_amount ?? 0} onChange={(e) => setForm({ ...form, front_paid_amount: Number(e.target.value) })} />
            </Field>
            <Field label="Front paid date">
              <Input type="date" value={form.front_paid_at ?? ""} onChange={(e) => setForm({ ...form, front_paid_at: e.target.value || null })} />
            </Field>
            <Field label="Back paid amount">
              <Input type="number" value={form.back_paid_amount ?? 0} onChange={(e) => setForm({ ...form, back_paid_amount: Number(e.target.value) })} />
            </Field>
            <Field label="Back paid date">
              <Input type="date" value={form.back_paid_at ?? ""} onChange={(e) => setForm({ ...form, back_paid_at: e.target.value || null })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
