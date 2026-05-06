import { useState, useEffect, useMemo } from "react";
import { Sparkles, Loader2, Mail, Copy, Calendar as CalendarIcon, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDeal } from "@/hooks/useDeals";
import { useDealObjections } from "@/hooks/useDealObjections";
import { useCommissionGrid } from "@/hooks/useCommissionGrid";
import { useFollowUps, useCreateFollowUp, useUpdateFollowUp } from "@/hooks/useFollowUps";
import { OBJECTIONS } from "@/data/objections";
import { toast } from "sonner";

interface Props {
  dealId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Existing follow-up to edit; if absent we create a new one */
  followUpId?: string | null;
}

export default function FollowUpComposer({ dealId, open, onOpenChange, followUpId }: Props) {
  const { user } = useAuth();
  const { data: deal } = useDeal(dealId);
  const { data: objections = [] } = useDealObjections(dealId);
  const { data: grid } = useCommissionGrid();
  const { data: existingList = [] } = useFollowUps(dealId ?? undefined);
  const create = useCreateFollowUp();
  const update = useUpdateFollowUp();

  const editing = useMemo(
    () => existingList.find((f) => f.id === followUpId) ?? null,
    [existingList, followUpId]
  );

  const [touchpoint, setTouchpoint] = useState(1);
  const [dueAt, setDueAt] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize when opening
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTouchpoint(editing.touchpoint_number);
      setDueAt(editing.due_at.slice(0, 16));
      setSubject(editing.ai_email_subject ?? "");
      setBody(editing.ai_email_body ?? "");
    } else {
      const nextNum = (existingList.filter((f) => !f.completed_at).length) + 1;
      setTouchpoint(nextNum);
      // default due based on SLA
      const sla = grid?.follow_up_sla?.touchpoints?.[nextNum - 1];
      const offsetH = sla?.offset_hours ?? 24;
      const d = new Date(Date.now() + offsetH * 36e5);
      setDueAt(d.toISOString().slice(0, 16));
      setSubject("");
      setBody("");
    }
  }, [open, editing, grid, existingList]);

  const generate = async () => {
    if (!deal) return;
    setDrafting(true);
    try {
      const repName = (user?.user_metadata?.full_name as string) || (user?.email?.split("@")[0] ?? "");
      const objLabels = objections.map(
        (o) => OBJECTIONS.find((x) => x.id === o.objection_type)?.label ?? o.objection_type
      );
      const { data, error } = await supabase.functions.invoke("draft-followup-email", {
        body: {
          homeowner: [deal.homeowner1, deal.homeowner2].filter(Boolean).join(" & "),
          rep_name: repName,
          rep_email: user?.email,
          address: deal.address,
          products: deal.products,
          notes: deal.notes,
          selected_option: deal.selected_option,
          price_a: deal.price_a,
          price_b: deal.price_b,
          price_c: deal.price_c,
          objections: objLabels,
          touchpoint_number: touchpoint,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      toast.success("Draft ready — review before sending");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  };

  const save = async () => {
    if (!dealId || !dueAt) return;
    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        updates: {
          touchpoint_number: touchpoint,
          due_at: new Date(dueAt).toISOString(),
          ai_email_subject: subject,
          ai_email_body: body,
        },
      });
      toast.success("Follow-up updated");
    } else {
      await create.mutateAsync({
        deal_id: dealId,
        touchpoint_number: touchpoint,
        due_at: new Date(dueAt).toISOString(),
        channel: "email",
        notes: null,
        ai_email_subject: subject || null,
        ai_email_body: body || null,
      });
      toast.success("Follow-up scheduled");
    }
    onOpenChange(false);
  };

  const markComplete = async () => {
    if (!editing) return;
    await update.mutateAsync({
      id: editing.id,
      updates: { completed_at: new Date().toISOString() },
    });
    toast.success("Marked complete");
    onOpenChange(false);
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mailto = useMemo(() => {
    const params = new URLSearchParams({ subject, body });
    return `mailto:?${params.toString()}`;
  }, [subject, body]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {editing ? "Edit follow-up" : "Schedule follow-up"}
          </DialogTitle>
          <DialogDescription>
            {deal?.homeowner1 ? `For ${deal.homeowner1}${deal.homeowner2 ? ` & ${deal.homeowner2}` : ""}` : ""}
            {" · "}AI drafts a personalized DaBella email from your appointment notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Touchpoint #</Label>
              <Input type="number" min={1} value={touchpoint}
                onChange={(e) => setTouchpoint(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Due at
              </Label>
              <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={generate} disabled={drafting} variant="default" className="gap-2">
              {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {body ? "Re-generate draft" : "Generate AI draft"}
            </Button>
            {body && (
              <>
                <Button variant="outline" size="sm" onClick={copyEmail} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </Button>
                <a href={mailto}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Open in mail
                  </Button>
                </a>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Auto-filled by AI draft" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)}
              rows={14} placeholder="Click ‘Generate AI draft’ to compose a personalized email."
              className="font-mono text-xs" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {editing && !editing.completed_at && (
            <Button variant="ghost" onClick={markComplete}>
              <Check className="h-4 w-4 mr-1.5" /> Mark complete
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save changes" : "Schedule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
