import { useState } from "react";
import type { EngineState, ComputedValues } from "@/types/engine";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, MessageSquare, Share2, Link2, Check, Loader2 } from "lucide-react";
import { buildCustomerPdf } from "@/lib/exportPdf";
import { uploadProposalPdf, nativeShare, buildEmailLink, buildSmsLink } from "@/lib/sharePdf";
import { buildOptionsArray } from "@/lib/engineHelpers";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  state: EngineState;
  computed: ComputedValues;
  selectedOption: "A" | "B" | "C" | null;
}

type Mode = "menu" | "email" | "sms";

export default function SharePdfDialog({ open, onOpenChange, state, computed, selectedOption }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("menu");
  const [email, setEmail] = useState(state.homeownerEmail || "");
  const [phone, setPhone] = useState(state.homeownerPhone || "");
  const [copied, setCopied] = useState(false);

  const customerName = state.homeowner1 || "Customer";
  const filename = `DaBella-Proposal-${customerName.replace(/\s+/g, "-")}.pdf`;

  async function ensureUpload(): Promise<string | null> {
    if (link) return link;
    setBusy("Generating proposal…");
    try {
      const options = buildOptionsArray(state, computed);
      const { blob } = await buildCustomerPdf(state, computed, options, selectedOption);
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
    setBusy("Building PDF…");
    try {
      const options = buildOptionsArray(state, computed);
      const { doc } = await buildCustomerPdf(state, computed, options, selectedOption);
      doc.save(filename);
      toast({ title: "Downloaded", description: filename });
    } finally {
      setBusy(null);
    }
  }

  async function handleNativeShare() {
    setBusy("Preparing share…");
    try {
      const options = buildOptionsArray(state, computed);
      const { blob } = await buildCustomerPdf(state, computed, options, selectedOption);
      const file = new File([blob], filename, { type: "application/pdf" });
      const ok = await nativeShare({
        title: "Your DaBella Proposal",
        text: `${customerName}, here's your proposal from DaBella.`,
        file,
      });
      if (!ok) {
        const url = await ensureUpload();
        if (url) {
          await nativeShare({ title: "Your DaBella Proposal", text: "Your DaBella proposal", url });
        }
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleSendEmail() {
    if (!email) return;
    const url = await ensureUpload();
    if (!url) return;
    const subject = `Your DaBella Proposal`;
    const body = `Hi ${customerName},\n\nThank you for your time today. Here is your personalized DaBella proposal:\n\n${url}\n\nLet me know if you have any questions.\n\n— Your DaBella Team`;
    window.location.href = buildEmailLink(email, subject, body);
  }

  async function handleSendSms() {
    if (!phone) return;
    const url = await ensureUpload();
    if (!url) return;
    const body = `Hi ${customerName}, here is your DaBella proposal: ${url}`;
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setMode("menu"); } onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Proposal</DialogTitle>
          <DialogDescription>
            Send {customerName}'s personalized proposal via email, text, or download.
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
            <p className="text-xs text-muted-foreground">Opens your default mail app with a link to the proposal.</p>
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
            <p className="text-xs text-muted-foreground">Opens your messaging app with a link to the proposal.</p>
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
