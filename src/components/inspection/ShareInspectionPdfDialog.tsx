import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, MessageSquare, Share2, Link2, Check, Loader2 } from "lucide-react";
import { uploadProposalPdf, nativeShare, buildEmailLink, buildSmsLink } from "@/lib/sharePdf";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  combinedReportLabel,
  type InspectionReportType, type InspectionSections,
} from "@/data/inspectionTemplates";
import type { InspectionPhoto } from "@/lib/pdf/inspection";

const loadPdfBuilder = () => import("@/lib/pdf/inspection").then((m) => m.buildInspectionPdf);

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName: string;
  address: string;
  reportTypes: InspectionReportType[];
  sections: InspectionSections;
  photos: InspectionPhoto[];
}

type Mode = "menu" | "email" | "sms";

export default function ShareInspectionPdfDialog({
  open, onOpenChange, customerName, address, reportTypes, sections, photos,
}: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("menu");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repDirty, setRepDirty] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setRepName(data?.display_name || user.user_metadata?.full_name || "");
      setRepEmail(data?.email || user.email || "");
      setRepPhone((data as { phone?: string } | null)?.phone || "");
      setRepDirty(false);
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  async function persistRepIfDirty() {
    if (!repDirty || !user) return;
    await supabase
      .from("profiles")
      .update({ phone: repPhone || null, display_name: repName || null })
      .eq("user_id", user.id);
    setRepDirty(false);
  }

  const rep = { name: repName.trim(), email: repEmail.trim(), phone: repPhone.trim() };
  const safeName = (customerName || "Homeowner").replace(/\s+/g, "_");
  const combinedLabel = combinedReportLabel(reportTypes);
  const filename = `${safeName}_${combinedLabel.replace(/\s+/g, "_")}.pdf`;

  async function build() {
    const builder = await loadPdfBuilder();
    return builder({ customerName, address, reportTypes, sections, photos, rep });
  }

  async function ensureUpload(): Promise<string | null> {
    if (link) return link;
    await persistRepIfDirty();
    setBusy("Generating report…");
    try {
      const { blob } = await build();
      setBusy("Uploading secure link…");
      const url = await uploadProposalPdf(blob, filename);
      setLink(url);
      return url;
    } catch (e) {
      toast({ title: "Upload failed", description: String((e as Error).message), variant: "destructive" });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    await persistRepIfDirty();
    setBusy("Building PDF…");
    try {
      const { doc } = await build();
      doc.save(filename);
      toast({ title: "Downloaded", description: filename });
    } finally {
      setBusy(null);
    }
  }

  async function handleNativeShare() {
    await persistRepIfDirty();
    setBusy("Preparing share…");
    try {
      const { blob } = await build();
      const file = new File([blob], filename, { type: "application/pdf" });
      const ok = await nativeShare({
        title: "Your DaBella Inspection Report",
        text: `${customerName}, here's your inspection report from DaBella.`,
        file,
      });
      if (!ok) {
        const url = await ensureUpload();
        if (url) await nativeShare({ title: "Your DaBella Inspection Report", text: "Your inspection report", url });
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleSendEmail() {
    if (!email) return;
    const url = await ensureUpload();
    if (!url) return;
    const subject = `Your DaBella ${combinedLabel} Report`;
    const body = `Hi ${customerName},\n\nThank you for your time today. Here is your personalized DaBella inspection report:\n\n${url}\n\nLet me know if you have any questions.\n\n— ${rep.name || "Your DaBella Team"}${rep.phone ? `\n${rep.phone}` : ""}`;
    window.location.href = buildEmailLink(email, subject, body);
  }

  async function handleSendSms() {
    if (!phone) return;
    const url = await ensureUpload();
    if (!url) return;
    const body = `Hi ${customerName}, here is your DaBella inspection report: ${url}${rep.name ? ` — ${rep.name}` : ""}`;
    window.location.href = buildSmsLink(phone, body);
  }

  async function handleCopyLink() {
    const url = await ensureUpload();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setMode("menu"); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Inspection Report</DialogTitle>
          <DialogDescription>
            Send {customerName}'s {combinedLabel.toLowerCase()} via email, text, or download.
          </DialogDescription>
        </DialogHeader>

        {busy && (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {busy}
          </div>
        )}

        {mode === "menu" && (
          <div className="grid grid-cols-2 gap-3">
            <ActionTile icon={<Download className="h-5 w-5" />} label="Download" onClick={handleDownload} disabled={!!busy} />
            <ActionTile icon={<Share2 className="h-5 w-5" />} label="Share…" onClick={handleNativeShare} disabled={!!busy} />
            <ActionTile icon={<Mail className="h-5 w-5" />} label="Email" onClick={() => setMode("email")} disabled={!!busy} />
            <ActionTile icon={<MessageSquare className="h-5 w-5" />} label="Text" onClick={() => setMode("sms")} disabled={!!busy} />
            <ActionTile
              className="col-span-2"
              icon={copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Link2 className="h-5 w-5" />}
              label={copied ? "Link copied" : "Copy secure link"}
              onClick={handleCopyLink}
              disabled={!!busy}
            />
          </div>
        )}

        {mode === "menu" && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your contact info (shown on report)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Your name" value={repName}
                onChange={(e) => { setRepName(e.target.value); setRepDirty(true); setLink(null); }}
                className="h-9 text-sm" />
              <Input placeholder="Phone" type="tel" value={repPhone}
                onChange={(e) => { setRepPhone(e.target.value); setRepDirty(true); setLink(null); }}
                className="h-9 text-sm" />
              <Input placeholder="name@dabella.us" type="email" value={repEmail}
                onChange={(e) => { setRepEmail(e.target.value); setRepDirty(true); setLink(null); }}
                className="h-9 text-sm col-span-2" />
            </div>
          </div>
        )}

        {mode === "email" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Customer email</Label>
              <Input id="email" type="email" placeholder="customer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("menu")} className="flex-1">Back</Button>
              <Button onClick={handleSendEmail} disabled={!email || !!busy} className="flex-1">
                <Mail className="h-4 w-4 mr-2" /> Open email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Opens your default mail app with a link to the report.</p>
          </div>
        )}

        {mode === "sms" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Customer phone</Label>
              <Input id="phone" type="tel" placeholder="(555) 555-5555" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("menu")} className="flex-1">Back</Button>
              <Button onClick={handleSendSms} disabled={!phone || !!busy} className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" /> Open texts
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Opens your messaging app with a link to the report.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActionTile({ icon, label, onClick, disabled, className = "" }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-all disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      <span className="text-primary">{icon}</span>
      {label}
    </button>
  );
}
