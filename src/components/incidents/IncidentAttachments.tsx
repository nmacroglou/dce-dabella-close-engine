import { useRef, useState } from "react";
import { Paperclip, Upload, X, FileText, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";
import type { Incident, IncidentAttachment } from "@/types/incident";

const BUCKET = "incident-attachments";

interface Props {
  incident: Incident;
}

export default function IncidentAttachments({ incident }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const attachments: IncidentAttachment[] = Array.isArray(incident.attachments) ? incident.attachments : [];

  const persist = async (next: IncidentAttachment[]) => {
    const { error } = await supabase
      .from("deal_incidents")
      .update({ attachments: next } as never)
      .eq("id", incident.id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["incidents"] });
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setBusy(true);
    try {
      const added: IncidentAttachment[] = [];
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/${incident.id}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
        if (error) throw error;
        added.push({ path, name: file.name, size: file.size, type: file.type });
      }
      await persist([...attachments, ...added]);
      toast.success(`Uploaded ${added.length} file${added.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(errMsg(e, "Upload failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onRemove = async (att: IncidentAttachment) => {
    if (!confirm(`Remove ${att.name}?`)) return;
    try {
      await supabase.storage.from(BUCKET).remove([att.path]);
      await persist(attachments.filter((a) => a.path !== att.path));
    } catch (e) {
      toast.error(errMsg(e, "Failed to remove"));
    }
  };

  const onOpen = async (att: IncidentAttachment) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(att.path, 300);
    if (error || !data) { toast.error(errMsg(error, "Could not open")); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" /> Attachments
          {attachments.length > 0 && (
            <span className="text-muted-foreground/70">({attachments.length})</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {busy ? "Uploading…" : "Add files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => onUpload(e.target.files)}
        />
      </div>

      {attachments.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">
          Attach screenshots of emails, paperwork, or audit notes here.
        </p>
      ) : (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li
              key={a.path}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-muted/30 text-xs"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 truncate text-foreground">{a.name}</span>
              {typeof a.size === "number" && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {(a.size / 1024).toFixed(0)} KB
                </span>
              )}
              <button onClick={() => onOpen(a)} className="text-primary hover:text-primary/80" title="Open">
                <Download className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onRemove(a)} className="text-muted-foreground hover:text-destructive" title="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
