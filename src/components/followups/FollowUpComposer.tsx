import { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, Loader2, Mail, Copy, Calendar as CalendarIcon, Check, Paperclip, X, Image as ImageIcon, FileText } from "lucide-react";
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
import type { FollowUpAttachment } from "@/types/followUp";
import { toast } from "sonner";

interface Props {
  dealId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  followUpId?: string | null;
}

const BUCKET = "followup-attachments";

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
  const [contextNotes, setContextNotes] = useState("");
  const [attachments, setAttachments] = useState<FollowUpAttachment[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTouchpoint(editing.touchpoint_number);
      setDueAt(editing.due_at.slice(0, 16));
      setSubject(editing.ai_email_subject ?? "");
      setBody(editing.ai_email_body ?? "");
      setContextNotes(editing.context_notes ?? "");
      setAttachments(editing.attachments ?? []);
    } else {
      const nextNum = (existingList.filter((f) => !f.completed_at).length) + 1;
      setTouchpoint(nextNum);
      const sla = grid?.follow_up_sla?.touchpoints?.[nextNum - 1];
      const offsetH = sla?.offset_hours ?? 24;
      const d = new Date(Date.now() + offsetH * 36e5);
      setDueAt(d.toISOString().slice(0, 16));
      setSubject("");
      setBody("");
      setContextNotes("");
      setAttachments([]);
    }
  }, [open, editing, grid, existingList]);

  const onUpload = async (files: FileList | null) => {
    if (!files || !files.length || !user || !dealId) return;
    setUploading(true);
    try {
      const added: FollowUpAttachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 15MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${dealId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) { toast.error(error.message); continue; }
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        added.push({
          url: signed?.signedUrl ?? "", path, name: file.name,
          type: file.type, size: file.size, caption: "",
        });
      }
      setAttachments((prev) => [...prev, ...added]);
      if (added.length) toast.success(`Added ${added.length} file${added.length > 1 ? "s" : ""}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAttachment = async (att: FollowUpAttachment) => {
    await supabase.storage.from(BUCKET).remove([att.path]).catch(() => {});
    setAttachments((prev) => prev.filter((a) => a.path !== att.path));
  };

  const updateCaption = (path: string, caption: string) => {
    setAttachments((prev) => prev.map((a) => a.path === path ? { ...a, caption } : a));
  };

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
          recipient_email: deal.homeowner_email,
          address: deal.address,
          products: deal.products,
          notes: deal.notes,
          selected_option: deal.selected_option,
          price_a: deal.price_a,
          price_b: deal.price_b,
          price_c: deal.price_c,
          objections: objLabels,
          touchpoint_number: touchpoint,
          context_notes: contextNotes,
          attachments: attachments.map((a) => ({
            name: a.name, type: a.type, caption: a.caption, url: a.url,
          })),
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
          context_notes: contextNotes || null,
          attachments,
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
        context_notes: contextNotes || null,
        attachments,
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
    const links = attachments.length
      ? `\n\nAttachments:\n${attachments.map((a) => `• ${a.name}: ${a.url}`).join("\n")}`
      : "";
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}${links}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mailto = useMemo(() => {
    const links = attachments.length
      ? `\n\nAttachments:\n${attachments.map((a) => `${a.name}: ${a.url}`).join("\n")}`
      : "";
    const params = new URLSearchParams({ subject, body: `${body}${links}` });
    const to = deal?.homeowner_email ? encodeURIComponent(deal.homeowner_email) : "";
    return `mailto:${to}?${params.toString()}`;
  }, [subject, body, attachments, deal?.homeowner_email]);

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
            {" · "}AI drafts a personalized DaBella email from your notes & photos.
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

          <div className="space-y-1.5">
            <Label className="text-xs">Notes for the AI (key points, objections, next steps)</Label>
            <Textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Mentioned the leak above the garage. Wife wants financing options under $300/mo. Likes Option B but worried about timing."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Attachments ({attachments.length})
              </Label>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="gap-1.5 h-8"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                Add files
              </Button>
              <input
                ref={fileRef} type="file" multiple hidden
                accept="image/*,application/pdf,.doc,.docx,.txt"
                onChange={(e) => onUpload(e.target.files)}
              />
            </div>
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((a) => (
                  <div key={a.path} className="rounded-lg border bg-muted/30 p-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      {a.type?.startsWith("image/") ? (
                        <img src={a.url} alt={a.name}
                          className="h-14 w-14 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-14 w-14 rounded bg-background border flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(a.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => removeAttachment(a)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={a.caption ?? ""}
                      onChange={(e) => updateCaption(a.path, e.target.value)}
                      placeholder="Caption (e.g. north-slope wear)"
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              rows={12} placeholder="Click 'Generate AI draft' to compose a personalized email."
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
