import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUpdateDeal } from "@/hooks/useDeals";
import { LEAD_SOURCE_LABELS, type Deal, type LeadSource } from "@/types/deal";
import { toast } from "sonner";

interface Props {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

export default function DealEditDialog({ deal, open, onClose }: Props) {
  const update = useUpdateDeal();
  const [homeowner1, setHomeowner1] = useState("");
  const [homeowner2, setHomeowner2] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadSource, setLeadSource] = useState<LeadSource | "unset">("unset");
  const [installDate, setInstallDate] = useState("");
  const [installNotes, setInstallNotes] = useState("");

  useEffect(() => {
    if (!deal) return;
    setHomeowner1(deal.homeowner1 ?? "");
    setHomeowner2(deal.homeowner2 ?? "");
    setAddress(deal.address ?? "");
    setEmail(deal.homeowner_email ?? "");
    setPhone(deal.homeowner_phone ?? "");
    setLeadSource((deal.lead_source as LeadSource | null) ?? "unset");
    setInstallDate(deal.install_date ?? "");
    setInstallNotes(deal.install_notes ?? "");
  }, [deal]);

  if (!deal) return null;

  const handleSave = async () => {
    if (!homeowner1.trim()) {
      toast.error("Homeowner name can't be empty");
      return;
    }
    try {
      await update.mutateAsync({
        id: deal.id,
        updates: {
          homeowner1: homeowner1.trim(),
          homeowner2: homeowner2.trim(),
          address: address.trim(),
          homeowner_email: email.trim() || null,
          homeowner_phone: phone.trim() || null,
          lead_source: leadSource === "unset" ? null : leadSource,
        },
      });
      toast.success("Deal updated");
      onClose();
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit deal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Homeowner 1</Label>
              <Input value={homeowner1} onChange={(e) => setHomeowner1(e.target.value)} placeholder="John Smith" />
            </div>
            <div className="space-y-1.5">
              <Label>Homeowner 2</Label>
              <Input value={homeowner2} onChange={(e) => setHomeowner2(e.target.value)} placeholder="Jane Smith" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="homeowner@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Lead source</Label>
            <Select value={leadSource} onValueChange={(v) => setLeadSource(v as LeadSource | "unset")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((k) => (
                  <SelectItem key={k} value={k}>{LEAD_SOURCE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
